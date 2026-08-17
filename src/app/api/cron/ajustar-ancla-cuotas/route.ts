import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// "trial_end" (ver src/lib/stripe/alinearFacturacion.ts) retrasa el cobro de
// una suscripción sin cobrar de más, pero en el modo de facturación de esta
// cuenta ("flexible") no reinicia por sí solo la fecha ancla al terminar la
// prueba: el cobro final saldría prorrateado (de menos) en vez del precio
// completo de la cuota. Esta tarea corrige eso el mismo día que cada
// suscripción sale de "prueba": reinicia la fecha ancla a "ahora" (que en
// ese momento coincide con el 1 de julio) sin generar ningún prorrateo, así
// que el cobro que sigue es siempre el 100% del precio de la cuota,
// independientemente de cuándo se hiciera socio/a cada uno.
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

  const ahora = Math.floor(Date.now() / 1000);
  const ajustados: string[] = [];
  const errores: string[] = [];
  let revisados = 0;

  for (const s of socios ?? []) {
    revisados++;
    try {
      const sub = await stripe.subscriptions.retrieve(s.stripe_subscription_id!);
      // Solo tocar las que hoy mismo terminan (o ya deberían haber terminado,
      // por si el cron falló algún día) su periodo de prueba de sincronización.
      if (sub.status !== "trialing" || !sub.trial_end || sub.trial_end > ahora) continue;

      await stripe.subscriptions.update(s.stripe_subscription_id!, {
        billing_cycle_anchor: "now",
        proration_behavior: "none",
      });
      ajustados.push(`${s.nombre} ${s.apellidos}`);
    } catch (e) {
      errores.push(`${s.nombre} ${s.apellidos}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({ revisados, ajustados, errores });
}
