import type { EstadoTicket } from "@/lib/supabase/types";

// Estados del ciclo de vida del ticket, con su etiqueta y color de badge.
// Flujo simple: llega (Nuevo) → se contesta (Respondido, automático al responder)
// → se da por terminado (Cerrado).
export const ESTADOS_TICKET: { valor: EstadoTicket; label: string; badge: string }[] = [
  { valor: "nuevo", label: "Nuevo", badge: "bg-rojo-50 text-rojo" },
  { valor: "respondido", label: "Respondido", badge: "bg-azul-100 text-azul-700" },
  { valor: "cerrado", label: "Cerrado", badge: "bg-green-100 text-green-700" },
];

export function etiquetaEstado(valor: EstadoTicket) {
  return ESTADOS_TICKET.find((e) => e.valor === valor) ?? { valor, label: valor, badge: "bg-neutral-100 text-neutral-600" };
}
