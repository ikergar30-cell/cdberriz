// Tipos de la base de datos (espejo de supabase/schema.sql).
// Si cambias el esquema, actualiza también estos tipos.

export type RolEmpleado = "admin" | "empleado";
export type EstadoSocio = "activo" | "pendiente" | "moroso" | "baja";
export type EstadoPago = "pagado" | "pendiente" | "fallido" | "reembolsado";

export interface Perfil {
  id: string;
  nombre: string;
  rol: RolEmpleado;
  created_at: string;
}

export interface TipoAbono {
  id: string;
  clave: string;
  nombre: string;
  precio_cents: number;
  stripe_price_id: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface Socio {
  id: string;
  numero_socio: number;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  dni: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  tipo_abono_id: string | null;
  estado: EstadoSocio;
  metodo_pago: string | null;
  carnet_token: string | null;
  foto_url: string | null;
  miembros_familia: { nombre: string }[];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  fecha_alta: string | null;
  notas: string | null;
  iban: string | null;
  carnet_fisico_pedido_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pago {
  id: string;
  socio_id: string | null;
  stripe_invoice_id: string | null;
  importe_cents: number;
  estado: EstadoPago;
  metodo: string | null;
  temporada: string | null;
  fecha: string;
  created_at: string;
}
