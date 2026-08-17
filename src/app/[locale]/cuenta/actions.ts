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

// Acceso al portal con email, DNI o número de socio: se busca el email
// asociado y se manda el enlace mágico ahí. SIEMPRE se responde con el mismo
// mensaje de éxito, se encuentre o no la ficha — así nadie puede usar este
// formulario para comprobar si un DNI o número de socio existe en el club.
export async function iniciarSesionPortal(identificador: string, locale: string): Promise<ActionResult> {
  const valor = identificador.trim();
  if (!valor) return { error: "Escribe tu email, DNI o número de socio." };

  const admin = createAdminClient();
  let email: string | null = null;

  if (valor.includes("@")) {
    email = valor;
  } else {
    const esNumero = /^\d+$/.test(valor);
    const { data } = await admin
      .from("socios")
      .select("email")
      .not("email", "is", null)
      .or(esNumero ? `numero_socio.eq.${valor}` : `dni.eq.${valor.toUpperCase()}`)
      .limit(1);
    email = data?.[0]?.email ?? null;
  }

  // Si no hay ficha o no tiene email guardado, no revelamos nada: se
  // devuelve éxito igualmente y simplemente no llega ningún correo.
  if (email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/${locale}/cuenta` },
    });
  }
}

const TIPOS_FOTO_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB

// Sube la foto del carné del propio socio (nunca la de otro: se localiza por
// la sesión, igual que el resto de acciones de este archivo).
export async function subirFotoCarnet(formData: FormData): Promise<ActionResult> {
  const sesion = await socioDeLaSesion();
  if (!sesion.ok) return { error: sesion.error };
  const { admin, socio } = sesion;

  const archivo = formData.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elige una foto." };
  }
  if (!TIPOS_FOTO_PERMITIDOS.includes(archivo.type)) {
    return { error: "La foto debe ser JPG, PNG o WEBP." };
  }
  if (archivo.size > TAMANO_MAXIMO_FOTO) {
    return { error: "La foto pesa demasiado (máximo 5 MB)." };
  }

  const extension = archivo.type === "image/png" ? "png" : archivo.type === "image/webp" ? "webp" : "jpg";
  // Nombre de archivo distinto cada vez para que el carné (cacheado por el
  // navegador) muestre la foto nueva de inmediato, sin esperar a que caduque
  // la caché de la anterior.
  const ruta = `${socio.id}/${Date.now()}.${extension}`;

  const { error: errorSubida } = await admin.storage
    .from("fotos-socios")
    .upload(ruta, archivo, { contentType: archivo.type, upsert: true });
  if (errorSubida) return { error: "No se pudo subir la foto. Inténtalo de nuevo." };

  const { data: publica } = admin.storage.from("fotos-socios").getPublicUrl(ruta);

  const { error } = await admin.from("socios").update({ foto_url: publica.publicUrl }).eq("id", socio.id);
  if (error) return { error: error.message };
}
