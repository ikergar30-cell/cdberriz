"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/lib/actionResult";

type SocioSesion = { id: string; stripe_subscription_id: string | null; titular_id: string | null };
type ResultadoSesion =
  | { ok: false; error: string }
  | { ok: true; admin: ReturnType<typeof createAdminClient>; socio: SocioSesion };

// Localiza la ficha del socio a partir de la sesión (enlace mágico) del
// PROPIO usuario — nunca de un id que mande el cliente, para que nadie
// pueda cancelar la cuota de otra persona.
async function socioDeLaSesion(): Promise<ResultadoSesion> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "No autorizado." };

  const admin = createAdminClient();
  // .limit(1) en vez de .maybeSingle(): un email duplicado entre dos socios
  // (dato antiguo mal cargado) haría que .maybeSingle() lance un error y
  // rompa el portal entero para esa persona en vez de dejarla entrar.
  const { data: socios, error } = await admin
    .from("socios")
    .select("id, stripe_subscription_id, titular_id")
    .ilike("email", user.email)
    .order("numero_socio", { ascending: true })
    .limit(1);
  if (error) return { ok: false, error: error.message };
  const socio = socios?.[0];
  if (!socio) return { ok: false, error: "No encontramos tu ficha de socio." };
  return { ok: true, admin, socio };
}

// Cancela la renovación (el socio sigue activo hasta el final del periodo ya
// pagado, igual que cuando lo hace un empleado desde el panel) y guarda el
// motivo en su ficha para que el club pueda hacer seguimiento.
export async function cancelarMiCuota(motivo: string, comentario: string): Promise<ActionResult> {
  const sesion = await socioDeLaSesion();
  if (!sesion.ok) return { error: sesion.error };
  const { admin, socio } = sesion;

  if (socio.titular_id) {
    return {
      error: "Este carné forma parte de un abono familiar: solo el titular que paga puede cancelarlo.",
    };
  }
  if (!socio.stripe_subscription_id) {
    return { error: "No tienes ninguna suscripción activa que cancelar." };
  }
  if (!motivo) {
    return { error: "Indica el motivo de la baja." };
  }

  await stripe.subscriptions.update(socio.stripe_subscription_id, { cancel_at_period_end: true });

  const { error } = await admin
    .from("socios")
    .update({
      motivo_baja: motivo,
      comentario_baja: comentario || null,
      fecha_solicitud_baja: new Date().toISOString(),
    })
    .eq("id", socio.id);
  if (error) return { error: error.message };
}

// Deshace una cancelación programada, por si el socio cambia de opinión
// antes de que termine el periodo ya pagado.
export async function reactivarMiCuota(): Promise<ActionResult> {
  const sesion = await socioDeLaSesion();
  if (!sesion.ok) return { error: sesion.error };
  const { socio } = sesion;
  if (!socio.stripe_subscription_id) {
    return { error: "No tienes ninguna suscripción que reactivar." };
  }

  await stripe.subscriptions.update(socio.stripe_subscription_id, { cancel_at_period_end: false });
}
