// Política de facturación: TODOS los socios se sincronizan a un único ciclo
// de cobro anual que remata el 30 de junio (fin de temporada), sin importar
// en qué mes se hagan socios. El primer pago (el del alta) siempre es el
// precio completo de la cuota — nunca se prorratea; solo se ajusta CUÁNDO
// cae el segundo cobro (ver src/lib/stripe/alinearFacturacion.ts).
export const MES_CIERRE_TEMPORADA = 5; // junio (0-indexado)
export const DIA_CIERRE_TEMPORADA = 30;

// Evita cobrar dos veces casi seguidas (p. ej. alguien que se hace socio el
// 20 de junio): si al 30 de junio más próximo le quedan menos de este
// margen, se salta directamente al 30 de junio del año siguiente.
const MARGEN_MINIMO_DIAS = 45;

/** Próximo 30 de junio a partir de una fecha, respetando el margen mínimo. */
export function proximoCierreTemporada(desde: Date): Date {
  const year = desde.getFullYear();
  let objetivo = new Date(Date.UTC(year, MES_CIERRE_TEMPORADA, DIA_CIERRE_TEMPORADA));
  const margenMs = MARGEN_MINIMO_DIAS * 24 * 60 * 60 * 1000;
  if (objetivo.getTime() - desde.getTime() < margenMs) {
    objetivo = new Date(Date.UTC(year + 1, MES_CIERRE_TEMPORADA, DIA_CIERRE_TEMPORADA));
  }
  return objetivo;
}
