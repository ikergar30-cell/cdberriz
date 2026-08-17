import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Diagnóstico de solo lectura: NO modifica nada. Lista el estado real en
// Stripe de cada suscripción con la sincronización al 1 de julio aplicada,
// para poder revisar de un vistazo que todas están bien configuradas
// (mismo trial_end, sin ningún Subscription Schedule colgado de una versión
// anterior del mecanismo) sin esperar a que llegue la fecha real.
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
    .select("id, numero_socio, nombre, apellidos, estado, stripe_subscription_id")
    .eq("metodo_pago", "stripe")
    .not("stripe_subscription_id", "is", null)
    .is("titular_id", null)
    .order("numero_socio");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const objetivo = new Date("2027-07-01T00:00:00Z").getTime() / 1000;
  const detalle: Record<string, unknown>[] = [];
  const errores: string[] = [];

  for (const s of socios ?? []) {
    try {
      const sub = await stripe.subscriptions.retrieve(s.stripe_subscription_id!);
      const facturasBorrador = await stripe.invoices.list({
        subscription: s.stripe_subscription_id!,
        status: "draft",
        limit: 1,
      });
      detalle.push({
        numero_socio: s.numero_socio,
        nombre: `${s.nombre} ${s.apellidos}`,
        estado_bd: s.estado,
        status_stripe: sub.status,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString().slice(0, 10) : null,
        trial_end_correcto: sub.trial_end === objetivo,
        tiene_schedule_colgado: Boolean(sub.schedule),
        current_period_end: sub.items.data[0]?.current_period_end
          ? new Date(sub.items.data[0].current_period_end * 1000).toISOString().slice(0, 10)
          : null,
        precio_esperado_cents: sub.items.data[0]?.price?.unit_amount ?? null,
        factura_borrador_pendiente: facturasBorrador.data.length > 0,
      });
    } catch (e) {
      errores.push(`${s.nombre} ${s.apellidos} (nº ${s.numero_socio}): ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({ total: socios?.length ?? 0, detalle, errores });
}
