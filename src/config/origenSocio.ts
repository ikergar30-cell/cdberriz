import type { OrigenSocio } from "@/lib/supabase/types";

// Los 3 "tipos de socio" que ve el club, derivados de origen + si paga cuota
// (tipo_abono_id asignado). No es una columna nueva: se calcula a partir de
// las dos que ya existen para no duplicar el dato en dos sitios.
export type TipoSocio = "socio" | "jugador" | "jugador_cuota";

export function tipoSocio(origen: OrigenSocio, tieneCuota: boolean): TipoSocio {
  if (origen === "jugador") return tieneCuota ? "jugador_cuota" : "jugador";
  return "socio";
}

export const TIPO_SOCIO_INFO: Record<TipoSocio, { label: string; badge: string }> = {
  socio: { label: "Socio", badge: "bg-azul-50 text-azul-700" },
  jugador: { label: "Por hijo/a", badge: "bg-green-100 text-green-700" },
  jugador_cuota: { label: "Por hijo/a + cuota", badge: "bg-dorado-100 text-dorado-800" },
};

export function etiquetaTipoSocio(origen: OrigenSocio, tieneCuota: boolean) {
  return TIPO_SOCIO_INFO[tipoSocio(origen, tieneCuota)];
}
