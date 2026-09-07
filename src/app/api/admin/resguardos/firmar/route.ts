import { readFile } from "fs/promises";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { empleadoPleno } from "@/lib/auth/empleado";
import { club } from "@/config/club";
import { generarResguardoPDF, nombreArchivoResguardo } from "@/lib/resguardos/pdf";
import { validarFila, type FilaEntrada } from "@/lib/resguardos/validar";

export const runtime = "nodejs";

// Genera UN resguardo firmado por las dos partes (club y persona), lo registra
// en la base de datos, lo envía por email a contabilidad y lo devuelve para
// que el empleado pueda compartirlo (p. ej. por WhatsApp) con la persona.
//
// Solo empleados PLENOS: el rol "verificador" (cuenta de taquilla, sin
// contraseña) no puede generar apuntes de pago.

const CONTABILIDAD_EMAIL = process.env.CONTABILIDAD_EMAIL || "contabilidadcdberriz@gmail.com";

// Convierte un "data:image/png;base64,…" en bytes, validando que sea PNG y que
// no esté vacío (una firma real ocupa varios KB) ni sea desproporcionado.
function pngDesdeDataUrl(dataUrl: unknown): Uint8Array | null {
  if (typeof dataUrl !== "string") return null;
  const m = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[1], "base64");
  if (buf.length < 200 || buf.length > 2_000_000) return null;
  return new Uint8Array(buf);
}

export async function POST(request: NextRequest) {
  if (!(await empleadoPleno())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let cuerpo: { tipo?: unknown; fila?: FilaEntrada; firmaClub?: unknown; firmaPersona?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo no válido" }, { status: 400 });
  }

  const tipo = cuerpo.tipo === "entrenador" ? "entrenador" : "arbitro";
  const datos = validarFila(cuerpo.fila ?? {}, tipo);
  if (typeof datos === "string") {
    return NextResponse.json({ error: datos }, { status: 400 });
  }

  const firmaClub = pngDesdeDataUrl(cuerpo.firmaClub);
  const firmaPersona = pngDesdeDataUrl(cuerpo.firmaPersona);
  if (!firmaClub || !firmaPersona) {
    return NextResponse.json(
      { error: "Faltan las dos firmas (club y persona)." },
      { status: 400 },
    );
  }

  // Registrar persona + pago (igual que en la generación en lote): el
  // resguardo firmado siempre tiene su apunte en la base de datos.
  const admin = createAdminClient();
  const { data: existente, error: errBusqueda } = await admin
    .from("personas_pago")
    .select("id, nombre")
    .eq("dni", datos.dni)
    .eq("tipo", datos.tipo)
    .maybeSingle();
  if (errBusqueda) {
    return NextResponse.json({ error: `No se pudo registrar a ${datos.nombre}` }, { status: 500 });
  }

  let personaId = existente?.id;
  if (existente) {
    if (existente.nombre !== datos.nombre) {
      await admin.from("personas_pago").update({ nombre: datos.nombre }).eq("id", existente.id);
    }
  } else {
    const { data: nueva, error: errAlta } = await admin
      .from("personas_pago")
      .insert({ nombre: datos.nombre, dni: datos.dni, tipo: datos.tipo })
      .select("id")
      .single();
    if (errAlta || !nueva) {
      return NextResponse.json({ error: `No se pudo registrar a ${datos.nombre}` }, { status: 500 });
    }
    personaId = nueva.id;
  }

  const { error: errPago } = await admin.from("resguardos").insert({
    persona_id: personaId,
    importe_cents: datos.importeCents,
    concepto: datos.concepto,
    fecha: datos.fecha,
  });
  if (errPago) {
    return NextResponse.json({ error: `No se pudo registrar el pago de ${datos.nombre}` }, { status: 500 });
  }

  // Generar el PDF con las dos firmas estampadas.
  const escudo = new Uint8Array(await readFile(path.join(process.cwd(), "public", "escudo.png")));
  const pdf = await generarResguardoPDF(datos, escudo, { club: firmaClub, persona: firmaPersona });
  const nombreArchivo = nombreArchivoResguardo(datos);

  // Enviar automáticamente a contabilidad con el PDF adjunto.
  let emailContabilidad = false;
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.CONTACT_FROM || club.remitente;
      await resend.emails.send({
        from,
        to: CONTABILIDAD_EMAIL,
        subject: `[Resguardo firmado] ${datos.nombre} — ${(datos.importeCents / 100).toFixed(2)} €`,
        text:
          `Resguardo de pago firmado por las dos partes.\n\n` +
          `Persona: ${datos.nombre} (${datos.tipo})\n` +
          `DNI: ${datos.dni}\n` +
          `Concepto: ${datos.concepto}\n` +
          `Fecha: ${datos.fecha}\n` +
          `Importe: ${(datos.importeCents / 100).toFixed(2)} €\n\n` +
          `El PDF firmado va adjunto.`,
        attachments: [{ filename: nombreArchivo, content: Buffer.from(pdf) }],
      });
      emailContabilidad = true;
    } catch {
      // Si falla el envío, no revertimos: el apunte ya está guardado y el PDF
      // se devuelve igualmente para poder compartirlo o reenviarlo a mano.
    }
  }

  return NextResponse.json({
    pdf: Buffer.from(pdf).toString("base64"),
    filename: nombreArchivo,
    emailContabilidad,
    destinatarioContabilidad: CONTABILIDAD_EMAIL,
  });
}
