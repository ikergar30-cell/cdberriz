// Los resguardos de árbitros y entrenadores llevan nombre, DNI e importe:
// son datos personales que no hace falta guardar indefinidamente (RGPD,
// principio de limitación del plazo de conservación). Se conservan 90 días
// —tiempo de sobra para reimprimir o cuadrar el pago— y después se borran
// solos en la tarea diaria (ver /api/cron/revisar-cuotas). El listado del
// panel filtra por la misma fecha, así que dejan de verse aunque el borrado
// llegue unas horas más tarde.
export const RESGUARDOS_DIAS_RETENCION = 90;

/** Fecha límite: lo anterior a esto ya no se muestra y se borra. */
export function limiteRetencionResguardos(desde = new Date()) {
  const limite = new Date(desde);
  limite.setDate(limite.getDate() - RESGUARDOS_DIAS_RETENCION);
  return limite;
}
