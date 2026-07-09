import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EstadoSocio } from "@/lib/supabase/types";

// Red de seguridad: si algún evento del webhook de Stripe se pierde (p. ej.
// un tipo de evento que no está activado en el endpoint, o un fallo puntual
// que agotó los reintentos), un socio puede quedarse "activo" en nuestra
// base de datos aunque en Stripe ya esté moroso o dado de baja. Esta tarea
// programada compara el estado real de cada suscripción en Stripe contra el
// guardado en Supabase, y corrige cualquier desajuste.
//
// Seguridad: solo se ejecuta con el secreto CRON_SECRET (cabecera Authorization).
export const runtime = "nodejs";

function estadoEsperado(sub: { status: string }): EstadoSocio | null {
  switch (sub.status) {
    case "active":
    case "trialing":
      return "activo";
    case "past_due":
    case "unpaid":
    case "incomplete_expired":
      return "moroso";
    case "canceled":
      return "baja";
    default:
      // "incomplete" (SEPA todavía sin confirmar el primer cobro): lo deja
      // como "pendiente", que ya es lo normal en ese momento.
      return null;
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createAdminClient();

  const { data: socios, error } = await db
    .from("socios")
    .select("id, nombre, apellidos, estado, stripe_subscription_id")
    .eq("metodo_pago", "stripe")
    .not("stripe_subscription_id", "is", null)
    // Solo los que llevan la voz cantante de la suscripción (el 2º carné
    // familiar comparte subscription_id con el titular, así que corregirlo
    // a través del titular ya lo actualiza a ambos con ".or(...)").
    .is("titular_id", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const corregidos: string[] = [];
  const errores: string[] = [];
  let revisados = 0;

  for (const s of socios ?? []) {
    revisados++;
    try {
      const sub = await stripe.subscriptions.retrieve(s.stripe_subscription_id!);
      const esperado = estadoEsperado(sub);
      if (!esperado || esperado === s.estado) continue;

      const { error: errUpdate } = await db
        .from("socios")
        .update({ estado: esperado })
        .or(`id.eq.${s.id},titular_id.eq.${s.id}`);
      if (errUpdate) throw new Error(errUpdate.message);

      corregidos.push(`${s.nombre} ${s.apellidos}: ${s.estado} → ${esperado}`);
    } catch (e) {
      errores.push(`${s.nombre} ${s.apellidos}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({ revisados, corregidos, errores });
}
