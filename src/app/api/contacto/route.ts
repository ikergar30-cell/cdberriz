import { NextResponse } from "next/server";
import { Resend } from "resend";
import { club } from "@/config/club";

// Endpoint del formulario de contacto. Recibe el mensaje del visitante y lo
// envía por email al club mediante Resend. No expone credenciales ni datos:
// la API key se lee de variables de entorno y nunca se registra en logs.
export async function POST(request: Request) {
  let datos: {
    nombre?: string;
    email?: string;
    asunto?: string;
    mensaje?: string;
  };

  try {
    datos = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  const nombre = (datos.nombre || "").trim().slice(0, 120);
  const email = (datos.email || "").trim().slice(0, 160);
  const asunto = (datos.asunto || "").trim().slice(0, 160);
  const mensaje = (datos.mensaje || "").trim().slice(0, 5000);

  if (!nombre || !email || !mensaje || !email.includes("@")) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios o el email no es válido." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL || club.email;
  if (!apiKey) {
    return NextResponse.json(
      { error: "El envío de email aún no está configurado." },
      { status: 503 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.CONTACT_FROM || "C.D. Berriz <onboarding@resend.dev>";
    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[Web] ${asunto || "Mensaje de contacto"} — ${nombre}`,
      text:
        `Nuevo mensaje desde el formulario de la web:\n\n` +
        `Nombre: ${nombre}\n` +
        `Email: ${email}\n` +
        `Asunto: ${asunto || "—"}\n\n` +
        `${mensaje}\n`,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje. Inténtalo más tarde." },
      { status: 500 },
    );
  }
}
