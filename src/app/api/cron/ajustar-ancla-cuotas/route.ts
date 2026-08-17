import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// "trial_end" (ver src/lib/stripe/alinearFacturacion.ts) retrasa el cobro de
// una suscripción sin cobrar de más, pero en el modo de facturación de esta
// cuenta ("flexible") no reinicia por sí solo la fecha ancla al terminar la
// prueba: Stripe genera automáticamente, en cuanto termina, una factura en
// borrador prorrateada (de menos) en vez de al precio completo de la cuota.
//
// Esta tarea busca esas facturas en borrador todavía sin cobrar, añade una
// línea que compensa exactamente el prorrateo (comprobado con un test clock
// de Stripe: deja el total en el precio completo real) y reinicia la fecha
// ancla de la suscripción para que el ciclo siguiente también quede bien.
// Corre cada hora porque Stripe finaliza y cobra esas facturas en borrador
// por su cuenta (normalmente ~1 hora después de crearlas), y hay que llegar
// antes de que eso pase.
//
// Seguridad: solo se ejecuta con el secreto CRON_SECRET (cabecera Authorization).
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createAdminClient();

  const { data: socios, error } = await db
    .from("socios")
    .select("id, nombre, apellidos, stripe_subscription_id")
    .eq("metodo_pago", "stripe")
    .not("stripe_subscription_id", "is", null)
    .is("titular_id", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ajustados: string[] = [];
  const errores: string[] = [];
  let revisados = 0;

  for (const s of socios ?? []) {
    revisados++;
    try {
      // La factura de renovación en borrador, si Stripe ya la ha generado
      // hoy al terminar la fase de sincronización de esta suscripción.
      const facturas = await stripe.invoices.list({
        subscription: s.stripe_subscription_id!,
        status: "draft",
        limit: 1,
      });
      const borrador = facturas.data.find((f) => f.billing_reason === "subscription_cycle");
      if (!borrador) continue;

      const lineas = await stripe.invoices.listLineItems(borrador.id!);
      // El precio real de la cuota es la suma de las líneas positivas (el
      // cargo del abono); cualquier línea negativa es el prorrateo de más
      // que Stripe añade solo y que hay que compensar.
      const esperado = lineas.data.filter((l) => l.amount > 0).reduce((sum, l) => sum + l.amount, 0);
      const ajuste = esperado - borrador.total;
      if (ajuste === 0) continue;

      await stripe.invoiceItems.create({
        customer: borrador.customer as string,
        invoice: borrador.id!,
        amount: ajuste,
        currency: borrador.currency,
        description: "Ajuste a cuota completa (sincronización de renovación al 1 de julio)",
      });
      await stripe.invoices.finalizeInvoice(borrador.id!);
      // Fuerza el intento de cobro ya mismo en vez de esperar a que Stripe lo
      // recoja por su cuenta (puede tardar): así el importe correcto queda
      // cobrado cuanto antes, no solo calculado.
      try {
        await stripe.invoices.pay(borrador.id!);
      } catch {
        // Si Stripe ya lo estaba cobrando por su cuenta en paralelo, o el
        // primer intento falla, lo reintentará solo — no es un fallo crítico.
      }

      // Deja el ciclo SIGUIENTE (el que empieza tras esta factura) también
      // anclado al 1 de julio, sin generar ningún prorrateo adicional.
      await stripe.subscriptions.update(s.stripe_subscription_id!, {
        billing_cycle_anchor: "now",
        proration_behavior: "none",
      });

      ajustados.push(`${s.nombre} ${s.apellidos}: ${(borrador.total / 100).toFixed(2)}€ → ${(esperado / 100).toFixed(2)}€`);
    } catch (e) {
      errores.push(`${s.nombre} ${s.apellidos}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({ revisados, ajustados, errores });
}
