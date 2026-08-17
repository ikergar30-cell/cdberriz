import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { suscribirNewsletter } from "@/lib/newsletter";
import { reAlinearRenovacion } from "@/lib/stripe/alinearFacturacion";

// Webhook de Stripe: sincroniza socios y pagos en Supabase.
// SEGURIDAD: cada evento se VERIFICA con la firma (STRIPE_WEBHOOK_SECRET); un
// atacante no puede inventarse pagos. Escribe con service_role (solo servidor).
// No registra secretos ni datos personales en logs.
export const runtime = "nodejs";

// Calcula la temporada del club ("2026-2027") según la fecha.
function temporadaActual(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// El cliente de Supabase no lanza excepción en error, devuelve { error }.
// Si no comprobamos esto, un fallo al guardar se ignora en silencio y
// respondemos 200 a Stripe, que entonces no reintenta el evento.
function comprobar<T>({ error }: { data: T; error: { message: string } | null }) {
  if (error) throw new Error(error.message);
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const firma = request.headers.get("stripe-signature");
  const payload = await request.text();

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(payload, firma!, secret);
  } catch {
    // Firma inválida → no es Stripe. Rechazar.
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    switch (evento.type) {
      // Alta completada: crear/actualizar el socio.
      case "checkout.session.completed": {
        const session = evento.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
        const m = customer.metadata || {};

        // Con tarjeta el pago se confirma al instante (subscription "active"),
        // pero con SEPA el cobro tarda unos días: la suscripción queda
        // "incomplete" hasta que Stripe confirma el adeudo. Si no está ya
        // activa, el socio entra "pendiente" y pasa a "activo" con
        // "invoice.paid" (o a "moroso" si el adeudo SEPA se devuelve).
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const estadoInicial = subscription.status === "active" || subscription.status === "trialing"
          ? "activo"
          : "pendiente";

        const { data: titular, error: errTitular } = await db
          .from("socios")
          .upsert(
            {
              nombre: m.nombre || customer.name || "",
              apellidos: m.apellidos || "",
              email: customer.email,
              telefono: m.telefono || customer.phone || null,
              direccion: m.direccion || null,
              poblacion: m.poblacion || null,
              codigo_postal: m.codigo_postal || null,
              dni: m.dni || null,
              tipo_abono_id: m.tipo_abono_id || null,
              estado: estadoInicial,
              metodo_pago: "stripe",
              fecha_nacimiento: m.fecha_nacimiento || null,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              // Fecha de alta = hoy, el día que se hace socio/a. No se
              // espera al "invoice.paid" del primer cobro (con SEPA puede
              // tardar días en confirmarse, y ese evento no siempre llega).
              fecha_alta: new Date().toISOString().slice(0, 10),
            },
            { onConflict: "stripe_customer_id" },
          )
          .select("id")
          .single();
        if (errTitular) throw new Error(errTitular.message);

        // Abono familiar: segundo carnet enlazado al titular que paga. El
        // contacto (email/teléfono) va por el titular; la dirección es la
        // misma. Lleva el mismo subscription_id para que la baja de la
        // suscripción dé de baja los dos carnets a la vez.
        if (m.clave === "familiar" && m.nombre2 && m.dni2) {
          const segundo = {
            nombre: m.nombre2,
            apellidos: m.apellidos2 || "",
            dni: m.dni2,
            // Opcional: si el segundo titular dio su propio email, puede
            // entrar solo con él al portal de socios y ver su propio carné.
            email: m.email2 || null,
            fecha_nacimiento: m.fecha_nacimiento2 || null,
            direccion: m.direccion || null,
            poblacion: m.poblacion || null,
            codigo_postal: m.codigo_postal || null,
            tipo_abono_id: m.tipo_abono_id || null,
            estado: estadoInicial,
            metodo_pago: "stripe",
            titular_id: titular.id,
            stripe_subscription_id: subscriptionId,
            fecha_alta: new Date().toISOString().slice(0, 10),
          };
          // Idempotente ante reintentos del webhook: si ya existe el 2º
          // carnet de este titular, se actualiza en vez de duplicarse.
          const { data: existente, error: errBusca } = await db
            .from("socios")
            .select("id")
            .eq("titular_id", titular.id)
            .maybeSingle();
          if (errBusca) throw new Error(errBusca.message);
          comprobar(
            existente
              ? await db.from("socios").update(segundo).eq("id", existente.id)
              : await db.from("socios").insert(segundo),
          );
        }

        // La sincronización del 2º cobro (y siguientes) al 1 de julio se
        // hace en "invoice.paid", nunca aquí: en un alta por SEPA el primer
        // cobro todavía está pendiente de confirmar en este punto, y tocar
        // la suscripción ahora podría interferir con él.

        // Alta automática en el boletín del club: ya es socio, así que se
        // ampara en el interés legítimo de informarle de la actividad del
        // club (no en consentimiento aparte); puede darse de baja en
        // cualquier momento desde el enlace de cada envío. No es crítico:
        // un fallo aquí no debe impedir el alta del socio.
        if (customer.email) {
          try {
            await suscribirNewsletter(customer.email, m.nombre || customer.name || undefined);
          } catch {
            /* no bloquea el alta del socio */
          }
        }
        break;
      }

      // Sesión de pago caducada sin pagar (24 h): se elimina el cliente en
      // Stripe para no acumular clientes "falsos". Cada checkout crea un
      // cliente nuevo, así que solo se borra si nunca llegó a ser socio.
      case "checkout.session.expired": {
        const session = evento.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string | null;
        if (!customerId) break;

        const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
        if (subs.data.length > 0) break;

        const { data: socio, error: errSocio } = await db
          .from("socios")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (errSocio) throw new Error(errSocio.message);
        if (socio) break;

        await stripe.customers.del(customerId);
        break;
      }

      // Pago correcto (alta inicial y renovaciones anuales).
      case "invoice.paid": {
        const inv = evento.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;

        const { data: socio, error: errSocio } = await db
          .from("socios")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (errSocio) throw new Error(errSocio.message);

        comprobar(
          await db.from("pagos").upsert(
            {
              socio_id: socio?.id ?? null,
              stripe_invoice_id: inv.id,
              importe_cents: inv.amount_paid,
              estado: "pagado",
              temporada: temporadaActual(),
              fecha: new Date().toISOString(),
              stripe_hosted_invoice_url: inv.hosted_invoice_url ?? null,
              stripe_invoice_pdf: inv.invoice_pdf ?? null,
            },
            { onConflict: "stripe_invoice_id" },
          ),
        );

        if (socio?.id) {
          // Incluye el 2º carnet del abono familiar (titular_id).
          comprobar(
            await db
              .from("socios")
              .update({ estado: "activo" })
              .or(`id.eq.${socio.id},titular_id.eq.${socio.id}`),
          );

          // Fecha de alta = fecha del PRIMER pago confirmado. Solo se rellena
          // si todavía está vacía, para no pisarla en cada renovación anual.
          const fechaPago = inv.status_transitions?.paid_at
            ? new Date(inv.status_transitions.paid_at * 1000).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);
          comprobar(
            await db
              .from("socios")
              .update({ fecha_alta: fechaPago })
              .is("fecha_alta", null)
              .or(`id.eq.${socio.id},titular_id.eq.${socio.id}`),
          );
        }

        // Red de seguridad: en cada pago (alta o renovación) comprueba que la
        // fecha de renovación sigue apuntando a la temporada actual. No
        // cobra ni devuelve nada (proration_behavior: none); si alguna vez
        // cambia la política de facturación, esto va corrigiendo solo a
        // todo el mundo sin depender de que alguien pulse el botón manual.
        const subscriptionRef = inv.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
        if (subscriptionId) {
          try {
            await reAlinearRenovacion(subscriptionId);
          } catch (e) {
            console.error("[stripe/webhook] No se pudo resincronizar la renovación:", e);
          }
        }
        break;
      }

      // Pago fallido → marcar moroso.
      case "invoice.payment_failed": {
        const inv = evento.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;

        const { data: socio, error: errSocio } = await db
          .from("socios")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (errSocio) throw new Error(errSocio.message);

        if (socio?.id) {
          // Incluye el 2º carnet del abono familiar (titular_id).
          comprobar(
            await db
              .from("socios")
              .update({ estado: "moroso" })
              .or(`id.eq.${socio.id},titular_id.eq.${socio.id}`),
          );
          comprobar(
            await db.from("pagos").upsert(
              {
                socio_id: socio.id,
                stripe_invoice_id: inv.id,
                importe_cents: inv.amount_due,
                estado: "fallido",
                temporada: temporadaActual(),
                fecha: new Date().toISOString(),
                stripe_hosted_invoice_url: inv.hosted_invoice_url ?? null,
                stripe_invoice_pdf: inv.invoice_pdf ?? null,
              },
              { onConflict: "stripe_invoice_id" },
            ),
          );
        }
        break;
      }

      // Suscripción cancelada → baja.
      case "customer.subscription.deleted": {
        const sub = evento.data.object as Stripe.Subscription;
        comprobar(
          await db.from("socios").update({ estado: "baja" }).eq("stripe_subscription_id", sub.id),
        );
        break;
      }
    }
  } catch {
    // Error procesando: devolvemos 500 para que Stripe reintente.
    return NextResponse.json({ error: "Error procesando el evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
