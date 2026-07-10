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

  // Buscar la ficha del socio por email. .limit(1) en vez de .maybeSingle():
  // un email duplicado entre dos socios (dato antiguo mal cargado) haría que
  // .maybeSingle() lance un error y la solicitud falle sin motivo aparente.
  const { data: sociosCoincidentes, error: errorSocio } = await admin
    .from("socios")
    .select("id, nombre, apellidos, numero_socio, direccion, carnet_fisico_pedido_en, carnet_fisico_entregado_en")
    .ilike("email", user.email)
    .order("numero_socio", { ascending: true })
    .limit(1);
  const socio = sociosCoincidentes?.[0];

  if (errorSocio || !socio) {
    return NextResponse.json(
      { error: "No se encontró tu ficha de socio." },
      { status: 404 },
    );
  }

  // Solo se bloquea si hay una solicitud EN CURSO (pedida y aún no entregada).
  // Si la anterior ya se entregó, puede volver a pedirlo (tarjeta perdida,
  // nueva temporada…) y se registra como una entrada nueva del histórico.
  if (socio.carnet_fisico_pedido_en && !socio.carnet_fisico_entregado_en) {
    return NextResponse.json(
      { error: "Ya tienes una solicitud de carné físico en curso." },
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

  // Estado actual (última solicitud): marca pedido, limpia entregado por si
  // es una re-solicitud, y guarda la dirección si faltaba.
  const ahora = new Date().toISOString();
  const update: Record<string, unknown> = {
    carnet_fisico_pedido_en: ahora,
    carnet_fisico_entregado_en: null,
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

  // Registro histórico: una fila por cada solicitud.
  const d = new Date(ahora);
  const y = d.getFullYear();
  const temporada = d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  await admin.from("carnets_fisicos").insert({ socio_id: socio.id, temporada, solicitado_en: ahora });

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
