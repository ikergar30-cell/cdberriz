// Política de facturación: TODOS los socios se sincronizan a un único ciclo
// de cobro anual que remata el 1 de julio (inicio de temporada), sin importar
// en qué mes se hagan socios. El primer pago (el del alta) siempre es el
// precio completo de la cuota — nunca se prorratea; solo se ajusta CUÁNDO
// cae el segundo cobro (ver src/lib/stripe/alinearFacturacion.ts).
export const MES_CIERRE_TEMPORADA = 6; // julio (0-indexado)
export const DIA_CIERRE_TEMPORADA = 1;

// Evita cobrar dos veces casi seguidas (p. ej. alguien que se hace socio el
// 20 de junio): si al 1 de julio más próximo le quedan menos de este
// margen, se salta directamente al 1 de julio del año siguiente.
const MARGEN_MINIMO_DIAS = 45;

/** Próximo 1 de julio a partir de una fecha, respetando el margen mínimo. */
export function proximoCierreTemporada(desde: Date): Date {
  const year = desde.getFullYear();
  let objetivo = new Date(Date.UTC(year, MES_CIERRE_TEMPORADA, DIA_CIERRE_TEMPORADA));
  const margenMs = MARGEN_MINIMO_DIAS * 24 * 60 * 60 * 1000;
  if (objetivo.getTime() - desde.getTime() < margenMs) {
    objetivo = new Date(Date.UTC(year + 1, MES_CIERRE_TEMPORADA, DIA_CIERRE_TEMPORADA));
  }
  return objetivo;
}
