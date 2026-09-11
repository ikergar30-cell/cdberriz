import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { club } from "@/config/club";

// Webhook de correo ENTRANTE (Resend Inbound). Cuando alguien responde por email
// a una respuesta del club, Resend nos avisa aquí y guardamos ese mensaje en el
// hilo del ticket, para que la intranet tenga la conversación completa.
//
// SEGURIDAD: cada evento se VERIFICA con la firma Svix (INBOUND_WEBHOOK_SECRET),
// igual que el webhook de Stripe. Escribe con service_role (solo servidor) y no
// registra secretos en logs.
//
// ACTIVACIÓN (hasta que estén estas variables, el envío sigue funcionando igual):
//   - INBOUND_DOMAIN         p.ej. "buzon.cdberriz.com" (subdominio con MX a Resend)
//   - INBOUND_WEBHOOK_SECRET  el "signing secret" del webhook de Resend (whsec_…)
export const runtime = "nodejs";

// Verifica la firma Svix (la que usa Resend en sus webhooks).
function firmaValida(secret: string, id: string, ts: string, firmas: string, cuerpo: string) {
  // Rechaza timestamps muy viejos/futuros (anti-repetición): 5 min de margen.
  const edad = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(edad) || edad > 300) return false;
  const clave = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const esperada = crypto.createHmac("sha256", clave).update(`${id}.${ts}.${cuerpo}`).digest("base64");
  const esperadaBuf = Buffer.from(esperada);
  // La cabecera trae una o varias firmas "v1,<sig> v1,<sig>…"
  return firmas.split(" ").some((parte) => {
    const sig = parte.split(",")[1];
    if (!sig) return false;
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === esperadaBuf.length && crypto.timingSafeEqual(sigBuf, esperadaBuf);
  });
}

// Extrae el id de ticket de una dirección "hilo-<uuid>@dominio".
function ticketIdDe(direcciones: string[]): string | null {
  for (const d of direcciones) {
    const m = /hilo-([0-9a-fA-F-]{36})@/.exec(d);
    if (m) return m[1];
  }
  return null;
}

// Separa "Nombre <email@x.com>" en nombre y email.
function parseRemitente(from: string): { nombre: string; email: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from);
  if (m) return { nombre: m[1].trim() || m[2].trim(), email: m[2].trim() };
  return { nombre: from.trim(), email: from.trim() };
}

// Quita el histórico citado (la parte "> …" y "El … escribió:") para quedarnos
// solo con lo que la persona ha escrito de nuevo.
function limpiarRespuesta(texto: string): string {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const esInicioCita = (l: string) =>
    /^>/.test(l) || // línea citada
    /^\s*El\s.+20\d\d/i.test(l) || // "El vie, 11 sept 2026 a las 8:30, … escribió:" (Gmail es)
    /^\s*On\s.+20\d\d/i.test(l) || // "On Fri, Sep 11, 2026 … wrote:" (Gmail en)
    /\bescrib(ió|io):\s*$/i.test(l) ||
    /\bwrote:\s*$/i.test(l) ||
    /^\s*-{2,}\s*Original Message\s*-{2,}/i.test(l) ||
    /^\s*_{5,}\s*$/.test(l); // separador de Outlook
  const corte = lineas.findIndex(esInicioCita);
  const util = (corte >= 0 ? lineas.slice(0, corte) : lineas).join("\n").trim();
  return util || texto.trim();
}

export async function POST(request: NextRequest) {
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey) {
    return NextResponse.json({ error: "Recepción no configurada" }, { status: 500 });
  }

  const cuerpoBruto = await request.text();
  const id = request.headers.get("svix-id");
  const ts = request.headers.get("svix-timestamp");
  const firmas = request.headers.get("svix-signature");
  if (!id || !ts || !firmas || !firmaValida(secret, id, ts, firmas, cuerpoBruto)) {
    return NextResponse.json({ error: "Firma no válida" }, { status: 401 });
  }

  let evento: {
    type?: string;
    data?: {
      email_id?: string;
      from?: string;
      to?: string[];
      received_for?: string[];
      subject?: string;
    };
  };
  try {
    evento = JSON.parse(cuerpoBruto);
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }
  // Solo nos interesan los emails recibidos; el resto se confirma con 200.
  if (evento.type !== "email.received" || !evento.data?.email_id) {
    return NextResponse.json({ ok: true });
  }
  const data = evento.data;

  // Recuperar el contenido completo (el webhook solo trae metadatos).
  let contenido: { text?: string; html?: string } = {};
  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${data.email_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) contenido = await res.json();
  } catch {
    /* si falla, seguimos con lo que haya en los metadatos */
  }
  const textoPlano =
    contenido.text ||
    (contenido.html ? contenido.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") : "") ||
    "(sin contenido)";
  const mensaje = limpiarRespuesta(textoPlano);
  const remitente = parseRemitente(data.from || "");

  const admin = createAdminClient();
  const ticketId = ticketIdDe([...(data.received_for || []), ...(data.to || [])]);

  // Localizar el ticket. Si no se identifica, se crea uno nuevo para no perder
  // el mensaje (el buzón está vigilado y este subdominio es solo de respuestas).
  let idFinal = ticketId;
  if (ticketId) {
    const { data: existe } = await admin.from("tickets").select("id").eq("id", ticketId).maybeSingle();
    if (!existe) idFinal = null;
  }

  if (idFinal) {
    await admin
      .from("ticket_mensajes")
      .insert({ ticket_id: idFinal, del_club: false, autor: remitente.nombre, cuerpo: mensaje });
    // Vuelve a "nuevo" y sale de archivados/papelera: hay algo que atender.
    await admin
      .from("tickets")
      .update({ estado: "nuevo", archivado: false, eliminado_en: null })
      .eq("id", idFinal);
  } else {
    const { data: nuevo } = await admin
      .from("tickets")
      .insert({
        nombre: remitente.nombre,
        email: remitente.email,
        telefono: "",
        asunto: data.subject || "Respuesta por email",
      })
      .select("id")
      .single();
    if (nuevo) {
      idFinal = nuevo.id;
      await admin
        .from("ticket_mensajes")
        .insert({ ticket_id: nuevo.id, del_club: false, autor: remitente.nombre, cuerpo: mensaje });
    }
  }

  // Avisar (solo a la cuenta de la web) de que hay una respuesta nueva.
  try {
    const to = club.emailBuzon;
    const from = process.env.CONTACT_FROM || club.remitente;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cdberriz.com";
    await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: remitente.email,
      subject: `[Buzón web] Nueva respuesta de ${remitente.nombre} — ${data.subject || ""}`.trim(),
      text:
        `${remitente.nombre} (${remitente.email}) ha respondido en el buzón:\n\n` +
        `${mensaje}\n\n` +
        (idFinal ? `Ábrelo en la intranet: ${siteUrl}/admin/tickets/${idFinal}\n` : ""),
    });
  } catch {
    /* el aviso es informativo; el mensaje ya está guardado en el hilo */
  }

  return NextResponse.json({ ok: true });
}
