import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Verificar sesión del socio.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: { direccion?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body vacío es válido
  }

  const direccionNueva = (body.direccion ?? "").trim().slice(0, 300) || null;

  const admin = createAdminClient();

  // Buscar la ficha del socio por email.
  const { data: socio, error: errorSocio } = await admin
    .from("socios")
    .select("id, nombre, apellidos, numero_socio, direccion, carnet_fisico_pedido_en")
    .ilike("email", user.email)
    .maybeSingle();

  if (errorSocio || !socio) {
    return NextResponse.json(
      { error: "No se encontró tu ficha de socio." },
      { status: 404 },
    );
  }

  if (socio.carnet_fisico_pedido_en) {
    return NextResponse.json(
      { error: "Ya has solicitado el carné físico." },
      { status: 409 },
    );
  }

  // Si no tiene dirección guardada y no nos mandan una, rechazar.
  const direccionFinal = socio.direccion ?? direccionNueva;
  if (!direccionFinal) {
    return NextResponse.json(
      { error: "Necesitamos tu dirección para poder enviarte el carné." },
      { status: 422 },
    );
  }

  // Actualizar: marcar solicitud y, si procede, guardar la dirección.
  const update: Record<string, unknown> = {
    carnet_fisico_pedido_en: new Date().toISOString(),
  };
  if (!socio.direccion && direccionNueva) {
    update.direccion = direccionNueva;
  }

  const { error: errorUpdate } = await admin
    .from("socios")
    .update(update)
    .eq("id", socio.id);

  if (errorUpdate) {
    return NextResponse.json({ error: "Error al guardar la solicitud." }, { status: 500 });
  }

  // Notificar al club por email (no bloqueante: si falla Resend la solicitud queda guardada).
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.CONTACT_FROM || "C.D. Berriz <onboarding@resend.dev>";
      const to = process.env.CONTACT_EMAIL || "coordinacioncdberriz@gmail.com";
      const year = new Date().getFullYear();
      await resend.emails.send({
        from,
        to,
        subject: `[Socios] Solicitud de carné físico — ${socio.nombre} ${socio.apellidos} (nº ${socio.numero_socio})`,
        text:
          `Un socio ha solicitado su carné físico:\n\n` +
          `Nº socio: ${socio.numero_socio}\n` +
          `Nombre: ${socio.nombre} ${socio.apellidos}\n` +
          `Email: ${user.email}\n` +
          `Dirección: ${direccionFinal}\n\n` +
          `Entrega prevista: septiembre de ${year} en Berrizburu Futbol Zelaia.\n`,
      });
    } catch {
      // El email es informativo; no revertimos la solicitud si falla.
    }
  }

  return NextResponse.json({ ok: true });
}
