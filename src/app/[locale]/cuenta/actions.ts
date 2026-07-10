"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// Localiza la ficha del socio a partir de la sesión (enlace mágico) del
// PROPIO usuario — nunca de un id que mande el cliente, para que nadie
// pueda cancelar la cuota de otra persona.
async function socioDeLaSesion() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("No autorizado.");

  const admin = createAdminClient();
  const { data: socio, error } = await admin
    .from("socios")
    .select("id, stripe_subscription_id, titular_id")
    .ilike("email", user.email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!socio) throw new Error("No encontramos tu ficha de socio.");
  return { admin, socio };
}

// Cancela la renovación (el socio sigue activo hasta el final del periodo ya
// pagado, igual que cuando lo hace un empleado desde el panel) y guarda el
// motivo en su ficha para que el club pueda hacer seguimiento.
export async function cancelarMiCuota(motivo: string, comentario: string) {
  const { admin, socio } = await socioDeLaSesion();

  if (socio.titular_id) {
    throw new Error(
      "Este carné forma parte de un abono familiar: solo el titular que paga puede cancelarlo.",
    );
  }
  if (!socio.stripe_subscription_id) {
    throw new Error("No tienes ninguna suscripción activa que cancelar.");
  }
  if (!motivo) {
    throw new Error("Indica el motivo de la baja.");
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
  if (error) throw new Error(error.message);
}

// Deshace una cancelación programada, por si el socio cambia de opinión
// antes de que termine el periodo ya pagado.
export async function reactivarMiCuota() {
  const { socio } = await socioDeLaSesion();
  if (!socio.stripe_subscription_id) {
    throw new Error("No tienes ninguna suscripción que reactivar.");
  }

  await stripe.subscriptions.update(socio.stripe_subscription_id, { cancel_at_period_end: false });
}
