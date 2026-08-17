import { stripe } from "@/lib/stripe";
import { proximoCierreTemporada } from "@/config/facturacion";

/**
 * Convierte una suscripción recién creada (ya cobrada al precio completo) en
 * una gestionada por un Subscription Schedule con una única fase que termina
 * el próximo 1 de julio. Con "end_behavior: release", al llegar esa fecha
 * Stripe libera la suscripción y sigue cobrando anualmente por su cuenta
 * desde ese día — queda sincronizada con el resto de socios para siempre,
 * sin más intervención nuestra.
 *
 * IMPORTANTE: "proration_behavior: none" en la fase evita que este ajuste de
 * fechas genere un cobro adicional — el socio ya pagó el precio completo al
 * darse de alta; aquí solo se redefine CUÁNDO vence ese periodo.
 */
export async function alinearFacturacionATemporada(subscriptionId: string) {
  const suscripcion = await stripe.subscriptions.retrieve(subscriptionId);
  // Idempotente: si el webhook reintenta la llamada, no lo volvemos a hacer
  // (Stripe no deja crear un 2º schedule sobre una suscripción que ya tiene uno).
  if (suscripcion.schedule) return;

  const item = suscripcion.items.data[0];
  if (!item) return;

  const objetivo = Math.floor(proximoCierreTemporada(new Date()).getTime() / 1000);

  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId });

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: item.price.id, quantity: item.quantity ?? 1 }],
        start_date: "now",
        end_date: objetivo,
        proration_behavior: "none",
      },
    ],
  });
}

/**
 * Reajusta la fecha de renovación de una suscripción que YA está gestionada
 * por un Subscription Schedule (a diferencia de alinearFacturacionATemporada,
 * aquí SÍ actualizamos aunque ya exista un schedule — se usa para mover en
 * bloque a todos los socios existentes cuando cambia la fecha objetivo de
 * facturación, p. ej. de 30 de junio a 1 de julio).
 *
 * "proration_behavior: none" en la fase evita cualquier cobro o abono: solo
 * cambia CUÁNDO cae la próxima renovación, nunca el importe ya cobrado.
 */
export async function reAlinearRenovacion(
  subscriptionId: string,
): Promise<"ya_alineada" | "actualizada" | "creada" | "no_activa"> {
  const suscripcion = await stripe.subscriptions.retrieve(subscriptionId);
  if (!["active", "trialing", "past_due"].includes(suscripcion.status)) return "no_activa";

  const item = suscripcion.items.data[0];
  if (!item) return "no_activa";

  const objetivo = Math.floor(proximoCierreTemporada(new Date()).getTime() / 1000);

  if (suscripcion.schedule) {
    const scheduleId =
      typeof suscripcion.schedule === "string" ? suscripcion.schedule : suscripcion.schedule.id;
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
    const fase = schedule.phases[schedule.phases.length - 1];
    if (fase.end_date === objetivo) return "ya_alineada";

    await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: item.price.id, quantity: item.quantity ?? 1 }],
          start_date: fase.start_date,
          end_date: objetivo,
          proration_behavior: "none",
        },
      ],
    });
    return "actualizada";
  }

  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId });
  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: item.price.id, quantity: item.quantity ?? 1 }],
        start_date: "now",
        end_date: objetivo,
        proration_behavior: "none",
      },
    ],
  });
  return "creada";
}

/**
 * Cambia el precio de una suscripción YA activa (p. ej. un empleado cambia la
 * cuota del socio desde el panel) y cobra de inmediato la diferencia
 * prorrateada. Si la suscripción está gestionada por un Subscription
 * Schedule (alta reciente, todavía sin llegar al 1 de julio), primero la
 * libera, cambia el precio y crea un nuevo schedule con el nuevo precio para
 * que la fecha de sincronización (1 de julio) no se pierda.
 */
export async function cambiarCuotaStripe(subscriptionId: string, nuevoPriceId: string) {
  let suscripcion = await stripe.subscriptions.retrieve(subscriptionId);

  if (suscripcion.schedule) {
    const scheduleId =
      typeof suscripcion.schedule === "string" ? suscripcion.schedule : suscripcion.schedule.id;
    await stripe.subscriptionSchedules.release(scheduleId);
    suscripcion = await stripe.subscriptions.retrieve(subscriptionId);
  }

  const item = suscripcion.items.data[0];
  if (!item) throw new Error("La suscripción no tiene ningún ítem que actualizar.");

  await stripe.subscriptionItems.update(item.id, {
    price: nuevoPriceId,
    proration_behavior: "always_invoice",
  });

  // Recupera la sincronización al 1 de julio con el precio nuevo.
  await alinearFacturacionATemporada(subscriptionId);
}
