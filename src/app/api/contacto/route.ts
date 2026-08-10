import { NextResponse } from "next/server";
import { Resend } from "resend";
import { club } from "@/config/club";
import { createAdminClient } from "@/lib/supabase/admin";

// Endpoint del formulario de contacto. Crea un ticket en el buzón (para que
// los empleados lo gestionen desde el panel) y avisa a coordinación por email.
// No expone credenciales ni datos: la API key se lee de variables de entorno.
export async function POST(request: Request) {
  let datos: {
    nombre?: string;
    email?: string;
    telefono?: string;
    asunto?: string;
    mensaje?: string;
    pagina_web?: string;
    mostradoEn?: string;
  };

  try {
    datos = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  // Anti-spam: si el campo trampa viene relleno, o si se envía casi al
  // instante de mostrarse el formulario, es un bot. Respondemos "ok" sin
  // guardar nada ni avisar a nadie, para no darle pistas de que ha fallado.
  const tiempoTranscurrido = Date.now() - Number(datos.mostradoEn || 0);
  if (datos.pagina_web || !datos.mostradoEn || tiempoTranscurrido < 2500) {
    return NextResponse.json({ ok: true });
  }

  const nombre = (datos.nombre || "").trim().slice(0, 120);
  const email = (datos.email || "").trim().slice(0, 160);
  const telefono = (datos.telefono || "").trim().slice(0, 40);
  const asunto = (datos.asunto || "").trim().slice(0, 160);
  const mensaje = (datos.mensaje || "").trim().slice(0, 5000);

  // Todos los campos son obligatorios.
  if (!nombre || !email || !telefono || !asunto || !mensaje || !email.includes("@")) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios o el email no es válido." },
      { status: 400 },
    );
  }

  // 1. Crear el ticket en el buzón (fuente de verdad). Si esto falla, no
  //    seguimos: el mensaje del socio no se puede perder.
  const admin = createAdminClient();
  const { data: ticket, error: errTicket } = await admin
    .from("tickets")
    .insert({ nombre, email, telefono, asunto })
    .select("id")
    .single();
  if (errTicket || !ticket) {
    return NextResponse.json(
      { error: "No se pudo registrar el mensaje. Inténtalo más tarde." },
      { status: 500 },
    );
  }
  const { error: errMensaje } = await admin
    .from("ticket_mensajes")
    .insert({ ticket_id: ticket.id, del_club: false, autor: nombre, cuerpo: mensaje });
  if (errMensaje) {
    return NextResponse.json(
      { error: "No se pudo registrar el mensaje. Inténtalo más tarde." },
      { status: 500 },
    );
  }

  // 2. Avisar a coordinación por email. Es informativo: si Resend falla, el
  //    ticket ya está guardado, así que respondemos OK igualmente.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL || "coordinacioncdberriz@gmail.com";
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.CONTACT_FROM || club.remitente;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cdberriz.com";
      await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: `[Buzón web] ${asunto || "Mensaje de contacto"} — ${nombre}`,
        text:
          `Nuevo ticket en el buzón de contacto:\n\n` +
          `Nombre: ${nombre}\n` +
          `Email: ${email}\n` +
          `Teléfono: ${telefono}\n` +
          `Asunto: ${asunto}\n\n` +
          `${mensaje}\n\n` +
          `Gestiónalo desde el panel: ${siteUrl}/admin/tickets/${ticket.id}\n`,
      });
    } catch {
      /* el aviso es informativo; el ticket ya está guardado */
    }
  }

  return NextResponse.json({ ok: true });
}
