import { stripe } from "@/lib/stripe";

/**
 * Deja la PRÓXIMA factura de una suscripción al precio completo de la cuota.
 *
 * Al mover la renovación al 1 de julio con "trial_end", Stripe (en el modo de
 * facturación "flexible" de esta cuenta) añade por su cuenta una línea
 * negativa de "tiempo no utilizado": el socio que se apuntó en septiembre
 * pagaría 20,72 € en vez de 25 €. La política del club es cobrar siempre el
 * 100% de la cuota, se apunte cuando se apunte.
 *
 * La corrección es un concepto pendiente que compensa exactamente ese
 * descuento. Se añade EN CUANTO se re-alinea la suscripción (no el día del
 * cobro) por dos motivos: así el club ve el importe correcto en Stripe todo
 * el año, y así el cobro sale bien aunque falle la tarea programada.
 *
 * Es idempotente: si la previsión ya cuadra con la cuota, no hace nada.
 * Nunca ajusta a la baja — si saliera un importe mayor del esperado, lo deja
 * estar para que lo mire una persona.
 *
 * Comprobado con un reloj simulado de Stripe: previsión 25,00 € y cobro real
 * de 25,00 € el 1 de julio.
 */
export async function compensarProrrateoRenovacion(
  subscriptionId: string,
): Promise<{ ajustado: false } | { ajustado: true; ajusteCents: number }> {
  const suscripcion = await stripe.subscriptions.retrieve(subscriptionId);
  const item = suscripcion.items.data[0];
  if (!item?.price?.unit_amount) return { ajustado: false };

  const cuotaCents = item.price.unit_amount * (item.quantity ?? 1);

  const previsión = await stripe.invoices.createPreview({ subscription: subscriptionId });
  const ajuste = cuotaCents - previsión.total;
  if (ajuste <= 0) return { ajustado: false };

  await stripe.invoiceItems.create({
    customer: suscripcion.customer as string,
    subscription: subscriptionId,
    amount: ajuste,
    currency: previsión.currency,
    description: "Ajuste a cuota completa (renovación el 1 de julio)",
  });

  return { ajustado: true, ajusteCents: ajuste };
}
