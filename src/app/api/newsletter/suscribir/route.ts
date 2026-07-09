import { NextResponse } from "next/server";
import { suscribirNewsletter } from "@/lib/newsletter";

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

  try {
    await suscribirNewsletter(email, nombre);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Newsletter no configurada.") {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "No se pudo completar la suscripción." }, { status: 500 });
  }
}
