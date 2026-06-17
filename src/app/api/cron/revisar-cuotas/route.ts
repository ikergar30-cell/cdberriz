import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { cuotaEfectiva } from "@/lib/edad";

// Tarea programada (Vercel Cron): revisa la edad de los socios y, cuando un
// Joven supera los 25, cambia su suscripción de Stripe a Individual para que la
// SIGUIENTE renovación cobre la cuota correcta (sin cobro inmediato extra).
//
// Seguridad: solo se ejecuta con el secreto CRON_SECRET (cabecera Authorization).
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createAdminClient();

  // Cuotas joven → individual (ids y price de Stripe).
  const { data: tipos } = await db
    .from("tipos_abono")
    .select("id, clave, stripe_price_id");
  const joven = tipos?.find((t) => t.clave === "joven");
  const individual = tipos?.find((t) => t.clave === "individual");
  if (!joven || !individual?.stripe_price_id) {
    return NextResponse.json({ error: "Cuotas no configuradas" }, { status: 500 });
  }

  // Socios activos en cuota Joven, con fecha de nacimiento y suscripción Stripe.
  const { data: socios } = await db
    .from("socios")
    .select("id, nombre, apellidos, fecha_nacimiento, stripe_subscription_id")
    .eq("estado", "activo")
    .eq("metodo_pago", "stripe")
    .eq("tipo_abono_id", joven.id)
    .not("fecha_nacimiento", "is", null)
    .not("stripe_subscription_id", "is", null);

  const cambiados: string[] = [];
  const errores: string[] = [];

  for (const s of socios ?? []) {
    // ¿Sigue siendo joven por edad? Si no, le toca Individual.
    if (cuotaEfectiva("joven", s.fecha_nacimiento) === "joven") continue;

    try {
      // Cambia el precio de la suscripción SIN prorratear: aplica en la próxima
      // renovación, no genera cobro inmediato.
      const sub = await stripe.subscriptions.retrieve(s.stripe_subscription_id!);
      const itemId = sub.items.data[0]?.id;
      await stripe.subscriptions.update(s.stripe_subscription_id!, {
        items: [{ id: itemId, price: individual.stripe_price_id! }],
        proration_behavior: "none",
      });
      await db.from("socios").update({ tipo_abono_id: individual.id }).eq("id", s.id);
      cambiados.push(`${s.nombre} ${s.apellidos}`);
    } catch (e) {
      errores.push(`${s.nombre} ${s.apellidos}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({
    revisados: socios?.length ?? 0,
    cambiados_a_individual: cambiados,
    errores,
  });
}
