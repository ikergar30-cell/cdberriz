// Tipos de la base de datos (espejo de supabase/schema.sql).
// Si cambias el esquema, actualiza también estos tipos.

export type RolEmpleado = "admin" | "empleado" | "verificador";
export type EstadoSocio = "activo" | "pendiente" | "moroso" | "baja";
export type EstadoPago = "pagado" | "pendiente" | "fallido" | "reembolsado";
export type EstadoTicket = "nuevo" | "en_progreso" | "respondido" | "cerrado";
export type OrigenSocio = "cuota" | "jugador";

export interface Jugador {
  id: string;
  nombre: string;
  apellidos: string | null;
  equipo: string | null;
  temporada: string | null;
  fecha_nacimiento: string | null;
  madre_socio_id: string | null;
  padre_socio_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  asunto: string | null;
  categoria: string;
  estado: EstadoTicket;
  archivado: boolean;
  eliminado_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMensaje {
  id: string;
  ticket_id: string;
  del_club: boolean;
  autor: string | null;
  cuerpo: string;
  created_at: string;
}

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
  poblacion: string | null;
  codigo_postal: string | null;
  /** Abono familiar: id del socio pagador si este es el 2º titular. */
  titular_id: string | null;
  origen: OrigenSocio;
  /** Nº de tarjeta del sistema antiguo (compartido), solo histórico. */
  numero_socio_antiguo: number | null;
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
  carnet_fisico_entregado_en: string | null;
  carnet_fisico_recogida: string | null;
  motivo_baja: string | null;
  comentario_baja: string | null;
  fecha_solicitud_baja: string | null;
  created_at: string;
  updated_at: string;
}

export interface CarnetFisico {
  id: string;
  socio_id: string;
  temporada: string | null;
  solicitado_en: string;
  entregado_en: string | null;
}

export type TipoPersonaPago = "arbitro" | "entrenador";

export interface PersonaPago {
  id: string;
  nombre: string;
  dni: string;
  tipo: TipoPersonaPago;
  equipo: string | null; // solo entrenadores
  importe_cents: number | null; // importe mensual fijo (solo entrenadores)
  created_at: string;
}

export interface Resguardo {
  id: string;
  persona_id: string;
  importe_cents: number;
  concepto: string;
  fecha: string;
  created_at: string;
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
  stripe_hosted_invoice_url: string | null;
  stripe_invoice_pdf: string | null;
  created_at: string;
}
