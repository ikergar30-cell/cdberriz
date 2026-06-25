import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  let body: { email?: string; nombre?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().slice(0, 160);
  const nombre = (body.nombre ?? "").trim().slice(0, 80) || undefined;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email no válido." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: "Newsletter no configurada." }, { status: 503 });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      audienceId,
      email,
      firstName: nombre,
      unsubscribed: false,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo completar la suscripción." }, { status: 500 });
  }
}
