import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

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

        await db.from("socios").upsert(
          {
            nombre: m.nombre || customer.name || "",
            apellidos: m.apellidos || "",
            email: customer.email,
            telefono: m.telefono || customer.phone || null,
            direccion: m.direccion || null,
            dni: m.dni || null,
            tipo_abono_id: m.tipo_abono_id || null,
            estado: "activo",
            metodo_pago: "stripe",
            fecha_nacimiento: m.fecha_nacimiento || null,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            fecha_alta: new Date().toISOString().slice(0, 10),
          },
          { onConflict: "stripe_customer_id" },
        );
        break;
      }

      // Pago correcto (alta inicial y renovaciones anuales).
      case "invoice.paid": {
        const inv = evento.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;

        const { data: socio } = await db
          .from("socios")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

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
        );

        if (socio?.id) {
          await db.from("socios").update({ estado: "activo" }).eq("id", socio.id);
        }
        break;
      }

      // Pago fallido → marcar moroso.
      case "invoice.payment_failed": {
        const inv = evento.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;

        const { data: socio } = await db
          .from("socios")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (socio?.id) {
          await db.from("socios").update({ estado: "moroso" }).eq("id", socio.id);
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
          );
        }
        break;
      }

      // Suscripción cancelada → baja.
      case "customer.subscription.deleted": {
        const sub = evento.data.object as Stripe.Subscription;
        await db
          .from("socios")
          .update({ estado: "baja" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }
  } catch {
    // Error procesando: devolvemos 500 para que Stripe reintente.
    return NextResponse.json({ error: "Error procesando el evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
