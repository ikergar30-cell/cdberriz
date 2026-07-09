import { stripe } from "@/lib/stripe";
import { alinearFacturacionATemporada } from "@/lib/stripe/alinearFacturacion";

export interface DatosSEPA {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  iban: string;
  stripe_price_id: string;
  tipo_abono_id: string;
  clave: string;
  // Fecha en que Stripe hará el primer cobro real (YYYY-MM-DD).
  // Si es futura, la suscripción queda en trialing hasta esa fecha.
  fecha_inicio_cobro?: string | null;
}

export async function crearSuscripcionSEPA(datos: DatosSEPA) {
  const {
    nombre, apellidos, email, telefono, iban,
    stripe_price_id, tipo_abono_id, clave, fecha_inicio_cobro,
  } = datos;

  // 1. Crear cliente en Stripe
  const customer = await stripe.customers.create({
    email,
    name: `${nombre} ${apellidos}`,
    phone: telefono ?? undefined,
    metadata: { tipo_abono_id, clave, origen: "admin_sepa" },
  });

  try {
    // 2. Crear método de pago SEPA con el IBAN
    const pm = await stripe.paymentMethods.create({
      type: "sepa_debit",
      sepa_debit: { iban },
      billing_details: { name: `${nombre} ${apellidos}`, email },
    });

    // 3. Vincular el método al cliente
    await stripe.paymentMethods.attach(pm.id, { customer: customer.id });

    // 4. Establecer como método predeterminado de facturación
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: pm.id },
    });

    // 5. Crear la suscripción anual
    //    Si hay fecha_inicio_cobro futura, la suscripción queda en trialing
    //    hasta esa fecha y Stripe cobra automáticamente cuando llega.
    const subParams: Parameters<typeof stripe.subscriptions.create>[0] = {
      customer: customer.id,
      items: [{ price: stripe_price_id }],
      default_payment_method: pm.id,
      payment_settings: {
        payment_method_types: ["sepa_debit"],
        save_default_payment_method: "on_subscription",
      },
      metadata: { tipo_abono_id, clave, origen: "admin_sepa" },
    };

    if (fecha_inicio_cobro) {
      const ts = Math.floor(new Date(fecha_inicio_cobro).getTime() / 1000);
      if (ts > Math.floor(Date.now() / 1000)) {
        subParams.trial_end = ts;
      }
    }

    const subscription = await stripe.subscriptions.create(subParams);

    // Sincroniza el 2º cobro (y siguientes) al 30 de junio, igual que en el
    // alta pública. Si el empleado fijó una fecha de primer cobro futura
    // (trial_end), no tocamos nada aquí: ese primer cobro todavía no ha
    // ocurrido, así que la fecha de sincronización se calculará más
    // adelante si el empleado cambia la cuota o desde una revisión manual.
    if (!subParams.trial_end) {
      await alinearFacturacionATemporada(subscription.id);
    }

    return {
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      // trialing = cobro diferido; de lo contrario el primer pago ya está en curso
      estado: (subscription.status === "trialing" ? "pendiente" : "activo") as
        | "activo"
        | "pendiente",
    };
  } catch (err) {
    // Si algo falla después de crear el cliente, lo eliminamos para no dejar huérfanos
    try { await stripe.customers.del(customer.id); } catch { /* ignorar */ }
    throw err;
  }
}
