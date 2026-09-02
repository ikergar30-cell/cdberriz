"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/lib/actionResult";
import { REEMBOLSO_DIAS, diasDesde } from "@/config/reembolso";

type SocioSesion = {
  id: string;
  stripe_subscription_id: string | null;
  titular_id: string | null;
  metodo_pago: string | null;
};
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
    .select("id, stripe_subscription_id, titular_id, metodo_pago")
    .ilike("email", user.email)
    .order("numero_socio", { ascending: true })
    .limit(1);
  if (error) return { ok: false, error: error.message };
  const socio = socios?.[0];
  if (!socio) return { ok: false, error: "No encontramos tu ficha de socio." };
  return { ok: true, admin, socio };
}

// ¿Puede este socio acogerse al derecho de desistimiento (devolución del
// último pago + baja inmediata)? Solo dentro de los 14 días desde el pago Y
// sin haber usado ya el carné (cada entrada válida en el control de acceso
// queda registrada en "entradas") — igual que la versión del panel de admin.
async function elegibleDesistimiento(
  admin: ReturnType<typeof createAdminClient>,
  socioId: string,
): Promise<{ elegible: boolean; ultimoPago: { id: string; stripe_invoice_id: string | null; fecha: string } | null }> {
  const { data: ultimoPago } = await admin
    .from("pagos")
    .select("id, stripe_invoice_id, fecha")
    .eq("socio_id", socioId)
    .eq("estado", "pagado")
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!ultimoPago?.stripe_invoice_id || diasDesde(ultimoPago.fecha) > REEMBOLSO_DIAS) {
    return { elegible: false, ultimoPago: ultimoPago ?? null };
  }
  const { count: entradasUsadas } = await admin
    .from("entradas")
    .select("id", { count: "exact", head: true })
    .eq("socio_id", socioId);
  return { elegible: (entradasUsadas ?? 0) === 0, ultimoPago };
}

// Cancela la cuota. Si está dentro del plazo de desistimiento (14 días y sin
// haber usado el carné), se devuelve el último pago y se da de baja de
// inmediato. Si no, sigue activo hasta el final del periodo ya pagado, como
// siempre (Stripe deja de cobrarle a partir de ahí).
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

  const { elegible, ultimoPago } = await elegibleDesistimiento(admin, socio.id);

  if (elegible && ultimoPago?.stripe_invoice_id) {
    const pagosFactura = await stripe.invoicePayments.list({
      invoice: ultimoPago.stripe_invoice_id,
      limit: 1,
    });
    const pagoStripe = pagosFactura.data[0]?.payment.payment_intent;
    const paymentIntentId = typeof pagoStripe === "string" ? pagoStripe : pagoStripe?.id;
    if (paymentIntentId) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    }
    await stripe.subscriptions.cancel(socio.stripe_subscription_id);
    const { error } = await admin
      .from("socios")
      .update({
        estado: "baja",
        motivo_baja: motivo,
        comentario_baja: comentario || null,
        fecha_solicitud_baja: new Date().toISOString(),
      })
      .eq("id", socio.id);
    if (error) return { error: error.message };
    return;
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
// asociado y se manda el enlace mágico ahí. Si el DNI/número de socio no
// existe, se responde con el mismo mensaje de éxito genérico (no revelamos
// si ese dato está en el club). PERO si la ficha SÍ existe y no tiene email
// guardado, avisamos claramente: antes se devolvía el mismo "éxito" y la
// persona se quedaba esperando un correo que nunca iba a llegar, sin saber
// por qué (bug real, origen de quejas — sobre todo entre padres/madres
// socios "por hijo jugando" dados de alta sin pedirles su email).
export async function iniciarSesionPortal(
  identificador: string,
  locale: string,
): Promise<{ error?: string; sinEmail?: boolean }> {
  const valor = identificador.trim();
  if (!valor) return { error: "Escribe tu email, DNI o número de socio." };

  const admin = createAdminClient();
  let email: string | null = null;
  let sinEmail = false;

  if (valor.includes("@")) {
    email = valor;
  } else {
    const esNumero = /^\d+$/.test(valor);
    const { data } = await admin
      .from("socios")
      .select("email")
      .or(esNumero ? `numero_socio.eq.${valor}` : `dni.eq.${valor.toUpperCase()}`)
      .limit(1);
    if (data && data.length > 0) {
      email = data[0].email;
      sinEmail = !email;
    }
  }

  if (email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/${locale}/cuenta` },
    });
  }

  // Si no había ficha con ese DNI/número, ni "email"/"sinEmail" quedan a
  // true: el formulario mostrará el mensaje genérico de siempre.
  return { sinEmail };
}

// Cambia la cuenta bancaria a la que se domicilia la cuota. Solo aplica a
// quien paga por domiciliación bancaria directa gestionada por el club
// (fuera de Stripe): quien paga por Stripe cambia su tarjeta desde "Gestionar
// mi cuota", no aquí. El cambio queda guardado, pero el club tiene que
// actualizarlo también en el banco — no dispara ningún cobro automático.
export async function actualizarIban(nuevoIban: string): Promise<ActionResult> {
  const sesion = await socioDeLaSesion();
  if (!sesion.ok) return { error: sesion.error };
  const { admin, socio } = sesion;

  if (socio.metodo_pago !== "sepa_banco") {
    return { error: "Tu cuota no se paga por domiciliación bancaria directa." };
  }

  const iban = nuevoIban.replace(/\s+/g, "").toUpperCase();
  if (!/^ES\d{22}$/.test(iban)) {
    return { error: "El IBAN no es válido. Debe empezar por ES y tener 24 caracteres." };
  }

  const { error } = await admin.from("socios").update({ iban }).eq("id", socio.id);
  if (error) return { error: error.message };
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
