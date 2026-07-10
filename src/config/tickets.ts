import type { EstadoTicket } from "@/lib/supabase/types";

// Categorías con las que un empleado clasifica un ticket del buzón de contacto.
export const CATEGORIAS_TICKET = [
  { valor: "general", label: "General" },
  { valor: "socios", label: "Socios" },
  { valor: "patrocinadores", label: "Patrocinadores" },
  { valor: "equipos", label: "Equipos / Cantera" },
  { valor: "otros", label: "Otros" },
] as const;

export function etiquetaCategoria(valor: string): string {
  return CATEGORIAS_TICKET.find((c) => c.valor === valor)?.label ?? valor;
}

// Estados del ciclo de vida del ticket, con su etiqueta y color de badge.
export const ESTADOS_TICKET: { valor: EstadoTicket; label: string; badge: string }[] = [
  { valor: "nuevo", label: "Nuevo", badge: "bg-rojo-50 text-rojo" },
  { valor: "en_progreso", label: "En progreso", badge: "bg-amber-100 text-amber-800" },
  { valor: "respondido", label: "Respondido", badge: "bg-azul-100 text-azul-700" },
  { valor: "cerrado", label: "Cerrado", badge: "bg-green-100 text-green-700" },
];

export function etiquetaEstado(valor: EstadoTicket) {
  return ESTADOS_TICKET.find((e) => e.valor === valor) ?? { valor, label: valor, badge: "bg-neutral-100 text-neutral-600" };
}
