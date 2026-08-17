import { stripe } from "@/lib/stripe";
import { proximoCierreTemporada } from "@/config/facturacion";

/**
 * Reprograma cuándo cae el PRÓXIMO cobro de una suscripción ya activa (o su
 * primer cobro ya confirmado) para que caiga el 1 de julio próximo, sin
 * cobrar ni devolver nada. El mecanismo soportado por Stripe para esto es
 * "trial_end": fijarlo a una fecha futura convierte el periodo actual en uno
 * de prueba hasta esa fecha (con proration_behavior: none no genera ningún
 * cargo intermedio) y el siguiente cobro, al precio completo, cae justo ahí.
 *
 * NUNCA se llama antes de que el pago actual esté confirmado (ver el webhook,
 * "invoice.paid"): si se tocara antes, en un alta por SEPA con cobro
 * diferido podría interferir con ese primer cobro todavía pendiente.
 *
 * Un Subscription Schedule colgado de una versión anterior de este mecanismo
 * bloquea el cambio directo de trial_end, así que si lo hay, se libera antes.
 */
export async function reAlinearRenovacion(
  subscriptionId: string,
): Promise<"ya_alineada" | "actualizada" | "no_activa"> {
  const suscripcion = await stripe.subscriptions.retrieve(subscriptionId);
  if (!["active", "trialing", "past_due"].includes(suscripcion.status)) return "no_activa";

  const objetivo = Math.floor(proximoCierreTemporada(new Date()).getTime() / 1000);
  if (suscripcion.trial_end === objetivo) return "ya_alineada";

  if (suscripcion.schedule) {
    const scheduleId =
      typeof suscripcion.schedule === "string" ? suscripcion.schedule : suscripcion.schedule.id;
    await stripe.subscriptionSchedules.release(scheduleId);
  }

  await stripe.subscriptions.update(subscriptionId, {
    trial_end: objetivo,
    proration_behavior: "none",
  });
  return "actualizada";
}

/**
 * Cambia el precio de una suscripción YA activa (p. ej. un empleado cambia la
 * cuota del socio desde el panel) y cobra de inmediato la diferencia
 * prorrateada.
 */
export async function cambiarCuotaStripe(subscriptionId: string, nuevoPriceId: string) {
  const suscripcion = await stripe.subscriptions.retrieve(subscriptionId);

  const item = suscripcion.items.data[0];
  if (!item) throw new Error("La suscripción no tiene ningún ítem que actualizar.");

  await stripe.subscriptionItems.update(item.id, {
    price: nuevoPriceId,
    proration_behavior: "always_invoice",
  });

  // El cambio de precio factura de inmediato (always_invoice); en cuanto ese
  // pago quede confirmado, el webhook de "invoice.paid" ya reafirma la fecha
  // de renovación al 1 de julio por su cuenta.
}
