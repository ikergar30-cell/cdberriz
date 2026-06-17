-- ============================================================================
--  C.D. Berriz — Esquema de socios, pagos y empleados
--  Ejecutar en Supabase: SQL Editor → pegar este archivo → Run.
--  Diseñado con RLS (Row Level Security): por defecto NADIE accede a los datos.
--  - Los empleados (rol en "perfiles") acceden vía la app con su login.
--  - El servidor (webhooks de Stripe) usa la service_role key, que salta RLS.
--  Datos personales de socios → tratar con confidencialidad (RGPD).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PERFILES — empleados del club con acceso al panel
--    Se enlaza 1:1 con auth.users (el login de Supabase).
-- ----------------------------------------------------------------------------
create type rol_empleado as enum ('admin', 'empleado');

create table perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  rol         rol_empleado not null default 'empleado',
  created_at  timestamptz not null default now()
);

comment on table perfiles is 'Empleados con acceso al panel de gestión. admin = control total; empleado = gestión de socios.';

-- ----------------------------------------------------------------------------
-- 2. TIPOS DE ABONO — las cuotas del club
--    El precio vive aquí Y en Stripe (stripe_price_id los enlaza).
-- ----------------------------------------------------------------------------
create table tipos_abono (
  id              uuid primary key default gen_random_uuid(),
  clave           text unique not null,          -- joven | individual | familiar | jubilado
  nombre          text not null,
  precio_cents    integer not null,              -- en céntimos: 2500 = 25,00 €
  stripe_price_id text,                           -- se rellena al crear los precios en Stripe
  activo          boolean not null default true,
  orden           integer not null default 0,
  created_at      timestamptz not null default now()
);

comment on column tipos_abono.precio_cents is 'Importe en céntimos para evitar errores de coma flotante.';

-- Cuotas iniciales (precios reales del club). El stripe_price_id se actualiza luego.
insert into tipos_abono (clave, nombre, precio_cents, orden) values
  ('joven',      'Joven (menor de 25)', 2500, 1),
  ('individual', 'Individual',          4000, 2),
  ('familiar',   'Familiar',            6000, 3),
  ('jubilado',   'Jubilado/a',          2500, 4);

-- ----------------------------------------------------------------------------
-- 3. SOCIOS — el padrón de socios del club
-- ----------------------------------------------------------------------------
create type estado_socio as enum ('activo', 'pendiente', 'moroso', 'baja');

create table socios (
  id                     uuid primary key default gen_random_uuid(),
  numero_socio           serial unique,           -- número de socio correlativo
  nombre                 text not null,
  apellidos              text not null,
  email                  text,
  telefono               text,
  dni                    text,                    -- dato sensible (RGPD)
  direccion              text,
  fecha_nacimiento       date,
  tipo_abono_id          uuid references tipos_abono (id),
  estado                 estado_socio not null default 'pendiente',
  metodo_pago            text,                    -- stripe | sepa_banco | manual
  -- Carnet digital: token único e impredecible para el QR + foto del socio.
  carnet_token           text unique default replace(gen_random_uuid()::text, '-', ''),
  foto_url               text,                    -- ruta de la foto en Storage
  -- Para abonos familiares: nombres del resto de la familia cubierta.
  miembros_familia       jsonb not null default '[]'::jsonb,
  -- Enlace con Stripe (se rellena al pagar).
  stripe_customer_id     text,
  stripe_subscription_id text,
  fecha_alta             date,
  notas                  text,                    -- notas internas de los empleados
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index socios_estado_idx on socios (estado);
create index socios_email_idx on socios (lower(email));
-- Única (no parcial) para poder "upsert" por stripe_customer_id. En Postgres los
-- NULL se consideran distintos, así que admite muchos socios sin Stripe (SEPA/baja).
alter table socios add constraint socios_stripe_customer_key unique (stripe_customer_id);

comment on table socios is 'Padrón de socios. Datos personales — confidenciales (RGPD).';

-- ----------------------------------------------------------------------------
-- 4. PAGOS — historial de cobros (sincronizado desde Stripe por webhook)
-- ----------------------------------------------------------------------------
create type estado_pago as enum ('pagado', 'pendiente', 'fallido', 'reembolsado');

create table pagos (
  id                uuid primary key default gen_random_uuid(),
  socio_id          uuid references socios (id) on delete set null,
  stripe_invoice_id text unique,
  importe_cents     integer not null,
  estado            estado_pago not null default 'pendiente',
  metodo            text,                          -- card | sepa_debit
  temporada         text,                          -- p.ej. "2026-2027"
  fecha             timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index pagos_socio_idx on pagos (socio_id);

-- ----------------------------------------------------------------------------
-- 5. updated_at automático en socios
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger socios_updated_at
  before update on socios
  for each row execute function set_updated_at();

-- ============================================================================
--  SEGURIDAD (RLS) — activar en todas las tablas
-- ============================================================================
alter table perfiles    enable row level security;
alter table tipos_abono enable row level security;
alter table socios      enable row level security;
alter table pagos       enable row level security;

-- Helper: ¿el usuario autenticado es un empleado del club?
create or replace function es_empleado()
returns boolean language sql security definer stable as $$
  select exists (select 1 from perfiles where id = auth.uid());
$$;

-- Helper: ¿es admin?
create or replace function es_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin');
$$;

-- --- perfiles: cada empleado ve el suyo; los admin ven y gestionan todos ---
create policy "perfiles_ver_propio" on perfiles
  for select using (id = auth.uid() or es_admin());
create policy "perfiles_admin_gestiona" on perfiles
  for all using (es_admin()) with check (es_admin());

-- --- tipos_abono: lectura para empleados; modificación solo admin ---
create policy "abonos_lectura_empleados" on tipos_abono
  for select using (es_empleado());
create policy "abonos_escritura_admin" on tipos_abono
  for all using (es_admin()) with check (es_admin());

-- --- socios: acceso completo solo a empleados ---
create policy "socios_empleados" on socios
  for all using (es_empleado()) with check (es_empleado());

-- --- pagos: lectura para empleados (la escritura la hace el servidor con service_role) ---
create policy "pagos_lectura_empleados" on pagos
  for select using (es_empleado());

-- NOTA: las inserciones/actualizaciones de "pagos" y el enlace de stripe_customer_id
-- en "socios" las hace el webhook del servidor con la service_role key, que ignora RLS.
-- Por eso no hay políticas de escritura públicas para pagos: nadie desde el navegador
-- puede inventar un pago.

-- ----------------------------------------------------------------------------
--  ENTRADAS — control de acceso (check-in por día de partido)
--  Cada escaneo válido registra una entrada. Si un carné se comparte, solo el
--  primero "gasta" la entrada; el resto salen como "ya ha entrado".
-- ----------------------------------------------------------------------------
create table if not exists entradas (
  id          uuid primary key default gen_random_uuid(),
  socio_id    uuid references socios (id) on delete cascade,
  fecha       date not null default current_date,
  creado_en   timestamptz not null default now(),
  empleado_id uuid references perfiles (id)
);
create index if not exists entradas_socio_fecha_idx on entradas (socio_id, fecha);

alter table entradas enable row level security;
create policy "entradas_empleados" on entradas
  for all using (es_empleado()) with check (es_empleado());
