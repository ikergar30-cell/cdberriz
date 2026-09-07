"use server";

import { cookies } from "next/headers";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { club } from "@/config/club";
import type { ActionResult } from "@/lib/actionResult";
import { REEMBOLSO_DIAS, diasDesde } from "@/config/reembolso";
import { esDniValido, normalizarDni } from "@/lib/dni";
import { capitalizarPalabras } from "@/lib/texto";
import { camposFaltantesPortal, type CampoPortal } from "@/lib/socios/camposFaltantes";
import { resolverPortal, COOKIE_FICHA_PORTAL } from "@/lib/socios/sesionPortal";
import type { OrigenSocio } from "@/lib/supabase/types";

type SocioSesion = {
  id: string;
  stripe_subscription_id: string | null;
  titular_id: string | null;
  metodo_pago: string | null;
  origen: OrigenSocio;
  dni: string | null;
  telefono: string | null;
  direccion: string | null;
  poblacion: string | null;
  codigo_postal: string | null;
  fecha_nacimiento: string | null;
};
type ResultadoSesion =
  | { ok: false; error: string }
  | { ok: true; admin: ReturnType<typeof createAdminClient>; socio: SocioSesion };

// Localiza la ficha del socio a partir de la sesión (enlace mágico) del
// PROPIO usuario — nunca de un id que mande el cliente, para que nadie pueda
// tocar la cuota de otra persona. La resolución (incluida la desambiguación
// cuando varias personas comparten email) vive en un único sitio:
// resolverPortal(), en src/lib/socios/sesionPortal.ts.
async function socioDeLaSesion(): Promise<ResultadoSesion> {
  const res = await resolverPortal();
  if (res.tipo === "sin_sesion") return { ok: false, error: "No autorizado." };
  if (res.tipo === "sin_socio") return { ok: false, error: "No encontramos tu ficha de socio." };
  if (res.tipo === "elegir") {
    return {
      ok: false,
      error: "Con este email hay varias fichas de socio: elige la tuya en tu área de socio antes de continuar.",
    };
  }

  const admin = createAdminClient();
  // Ya identificada la ficha por su id (único), maybeSingle() es seguro.
  const { data: socio, error } = await admin
    .from("socios")
    .select(
      "id, stripe_subscription_id, titular_id, metodo_pago, origen, dni, telefono, direccion, poblacion, codigo_postal, fecha_nacimiento",
    )
    .eq("id", res.socioId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!socio) return { ok: false, error: "No encontramos tu ficha de socio." };
  return { ok: true, admin, socio };
}

// Cuando el email lo comparten varias fichas, guarda cuál ha elegido esta
// persona. Solo se acepta un id que de verdad esté entre esas fichas (nunca
// uno cualquiera que mande el cliente).
export async function elegirFichaPortal(socioId: string): Promise<ActionResult> {
  const res = await resolverPortal();
  if (res.tipo === "sin_sesion") return { error: "No autorizado." };
  const opciones = "opciones" in res ? res.opciones : [];
  if (!opciones.some((o) => o.id === socioId)) {
    return { error: "Esa ficha no está asociada a tu email." };
  }
  cookies().set(COOKIE_FICHA_PORTAL, socioId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 6 meses
  });
}

// Olvida la ficha elegida para volver a la pantalla de "¿quién eres?".
export async function olvidarFichaPortal(): Promise<ActionResult> {
  cookies().delete(COOKIE_FICHA_PORTAL);
  return;
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

    // Enlace mágico generado a mano (token_hash), NO con signInWithOtp: ese
    // usa el flujo PKCE de Supabase, que ata el enlace al navegador donde se
    // PIDIÓ — si el socio lo pide desde el ordenador y lo abre en el email
    // del móvil (lo normal), fallaba en silencio y acababa en la home. Con
    // token_hash el enlace funciona se abra donde se abra.
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const hashedToken = link?.properties?.hashed_token;

    if (!linkError && hashedToken) {
      const url = `${siteUrl}/auth/callback?token_hash=${hashedToken}&type=magiclink&next=/${locale}/cuenta`;
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        try {
          const resend = new Resend(apiKey);
          const from = process.env.CONTACT_FROM || club.remitente;
          const eu = locale === "eu";
          await resend.emails.send({
            from,
            to: email,
            subject: eu ? "Zure sarbide-esteka — C.D. Berriz" : "Tu enlace de acceso — C.D. Berriz",
            text: eu
              ? `Kaixo:\n\nSakatu esteka hau zure bazkide-arloan sartzeko:\n\n${url}\n\nEz baduzu zuk eskatu, ez ikusi mesedez.\n\nC.D. Berriz`
              : `Hola:\n\nPulsa este enlace para entrar en tu área de socio/a:\n\n${url}\n\nSi no lo has pedido tú, puedes ignorar este email.\n\nC.D. Berriz`,
          });
        } catch {
          /* si falla el envío, no hay más que hacer: no hay enlace de repuesto que mostrar */
        }
      }
    }
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

// Guarda los datos que el socio rellena en su portal cuando su ficha está
// incompleta (ver camposFaltantesPortal). Solo pide y solo escribe los campos
// que de verdad le faltan, según su tipo de socio; nunca vacía un dato que ya
// tuviera. Se localiza por la sesión, igual que el resto de acciones.
export async function completarDatosSocio(
  locale: string,
  formData: FormData,
): Promise<ActionResult> {
  const eu = locale === "eu";
  const t = (es: string, txtEu: string) => (eu ? txtEu : es);

  const sesion = await socioDeLaSesion();
  if (!sesion.ok) return { error: sesion.error };
  const { admin, socio } = sesion;

  // Fuente de la verdad: qué le falta de verdad AHORA en la base de datos.
  const faltantes = camposFaltantesPortal(socio);
  if (faltantes.length === 0) return; // ya estaba completo (otra pestaña, etc.)

  const etiqueta: Record<CampoPortal, string> = {
    dni: "DNI / NIE",
    telefono: t("teléfono", "telefonoa"),
    direccion: t("dirección", "helbidea"),
    poblacion: t("población", "herria"),
    codigo_postal: t("código postal", "posta kodea"),
    fecha_nacimiento: t("fecha de nacimiento", "jaiotze-data"),
  };

  const updates: Record<string, string> = {};

  for (const campo of faltantes) {
    const bruto = String(formData.get(campo) ?? "").trim();
    if (!bruto) {
      return { error: t(`Falta ${etiqueta[campo]}.`, `${etiqueta[campo]} falta da.`) };
    }
    switch (campo) {
      case "dni": {
        const dni = normalizarDni(bruto);
        if (!esDniValido(dni)) {
          return { error: t("El DNI / NIE no es válido.", "DNI / NIE ez da baliozkoa.") };
        }
        updates.dni = dni;
        break;
      }
      case "telefono": {
        const tel = bruto.replace(/\s+/g, "");
        if (!/^\+?\d{6,15}$/.test(tel)) {
          return { error: t("El teléfono no es válido.", "Telefonoa ez da baliozkoa.") };
        }
        updates.telefono = tel;
        break;
      }
      case "codigo_postal": {
        if (!/^\d{5}$/.test(bruto)) {
          return { error: t("El código postal debe tener 5 cifras.", "Posta kodeak 5 zifra izan behar ditu.") };
        }
        updates.codigo_postal = bruto;
        break;
      }
      case "fecha_nacimiento": {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(bruto)) {
          return { error: t("La fecha de nacimiento no es válida.", "Jaiotze-data ez da baliozkoa.") };
        }
        const fecha = new Date(`${bruto}T00:00:00`);
        const año = fecha.getFullYear();
        if (Number.isNaN(fecha.getTime()) || fecha > new Date() || año < 1900) {
          return { error: t("La fecha de nacimiento no es válida.", "Jaiotze-data ez da baliozkoa.") };
        }
        updates.fecha_nacimiento = bruto;
        break;
      }
      case "poblacion":
        updates.poblacion = capitalizarPalabras(bruto);
        break;
      case "direccion":
        updates.direccion = bruto;
        break;
    }
  }

  const { error } = await admin.from("socios").update(updates).eq("id", socio.id);
  if (error) {
    // El DNI tiene índice único: si ya está en otra ficha, avisamos claro en
    // vez de soltar el error crudo de Postgres.
    if (error.code === "23505") {
      return {
        error: t(
          "Ese DNI ya está registrado en otra ficha del club. Ponte en contacto con el club.",
          "DNI hori klubeko beste fitxa batean dago erregistratuta. Jarri klubarekin harremanetan.",
        ),
      };
    }
    return { error: error.message };
  }
}
