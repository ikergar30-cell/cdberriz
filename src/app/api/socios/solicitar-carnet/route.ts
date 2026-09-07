import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverPortal } from "@/lib/socios/sesionPortal";
import { club } from "@/config/club";

export async function POST(request: Request) {
  // Verificar sesión del socio y resolver SU ficha (coincidencia exacta de
  // email + desambiguación si el correo lo comparten varias personas).
  const portal = await resolverPortal();
  if (portal.tipo === "sin_sesion") {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (portal.tipo === "elegir") {
    return NextResponse.json(
      { error: "Con este email hay varias fichas: elige la tuya en tu área de socio." },
      { status: 409 },
    );
  }
  if (portal.tipo !== "ok") {
    return NextResponse.json(
      { error: "No se encontró tu ficha de socio." },
      { status: 404 },
    );
  }

  let body: { direccion?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body vacío es válido
  }

  const direccionNueva = (body.direccion ?? "").trim().slice(0, 300) || null;

  const admin = createAdminClient();

  // Ficha ya identificada por su id (único): maybeSingle() es seguro.
  const { data: socio } = await admin
    .from("socios")
    .select("id, nombre, apellidos, numero_socio, direccion, foto_url, carnet_fisico_pedido_en, carnet_fisico_entregado_en")
    .eq("id", portal.socioId)
    .maybeSingle();

  if (!socio) {
    return NextResponse.json(
      { error: "No se encontró tu ficha de socio." },
      { status: 404 },
    );
  }

  // El carné físico lleva la misma foto que el digital: sin foto subida no
  // se puede tramitar la solicitud.
  if (!socio.foto_url) {
    return NextResponse.json(
      { error: "Sube antes tu foto (arriba, en \"Carné digital\") para poder pedir el carné físico." },
      { status: 422 },
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
      const from = process.env.CONTACT_FROM || club.remitente;
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
          `Email: ${portal.email}\n` +
          `Dirección: ${direccionFinal}\n\n` +
          `Entrega prevista: septiembre de ${year} en Berrizburu Futbol Zelaia.\n`,
      });
    } catch {
      // El email es informativo; no revertimos la solicitud si falla.
    }
  }

  return NextResponse.json({ ok: true });
}
