import { readFile } from "fs/promises";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generarResguardoPDF,
  nombreArchivoResguardo,
  type DatosResguardo,
} from "@/lib/resguardos/pdf";

export const runtime = "nodejs";

// Genera resguardos de pago (PDF individual o ZIP en lote) y registra cada
// pago en la base de datos. Solo empleados autenticados.

type FilaEntrada = {
  nombre?: unknown;
  dni?: unknown;
  importe?: unknown; // euros, p.ej. "40" o "40,50"
  concepto?: unknown; // partido (árbitros) o mes "YYYY-MM" (entrenadores)
  fecha?: unknown; // "YYYY-MM-DD"
};

function parsearImporteCents(v: unknown): number | null {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function validarFila(fila: FilaEntrada, tipo: "arbitro" | "entrenador"): DatosResguardo | string {
  const nombre = String(fila.nombre ?? "").trim();
  const dni = String(fila.dni ?? "").trim().toUpperCase();
  const concepto = String(fila.concepto ?? "").trim();
  const fecha = String(fila.fecha ?? "").trim();
  const importeCents = parsearImporteCents(fila.importe);

  if (!nombre) return "Falta el nombre";
  if (!dni) return "Falta el DNI";
  if (!importeCents) return `Importe no válido (${fila.importe})`;
  if (!concepto) return tipo === "arbitro" ? "Falta el partido" : "Falta el mes";
  if (tipo === "entrenador" && !/^\d{4}-\d{2}$/.test(concepto)) return "Mes no válido";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "Fecha no válida";

  return { tipo, nombre, dni, importeCents, concepto, fecha };
}

// Vuelve a descargar el PDF de un resguardo ya registrado (no crea apuntes).
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

  const admin = createAdminClient();
  const { data: r } = await admin
    .from("resguardos")
    .select("importe_cents, concepto, fecha, personas_pago(nombre, dni, tipo)")
    .eq("id", id)
    .maybeSingle();

  const persona = (r as unknown as {
    personas_pago?: { nombre: string; dni: string; tipo: "arbitro" | "entrenador" } | null;
  } | null)?.personas_pago;
  if (!r || !persona) {
    return NextResponse.json({ error: "Resguardo no encontrado" }, { status: 404 });
  }

  const datos: DatosResguardo = {
    tipo: persona.tipo,
    nombre: persona.nombre,
    dni: persona.dni,
    importeCents: r.importe_cents,
    concepto: r.concepto,
    fecha: r.fecha,
  };

  const escudo = new Uint8Array(
    await readFile(path.join(process.cwd(), "public", "escudo.png")),
  );
  const pdf = await generarResguardoPDF(datos, escudo);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombreArchivoResguardo(datos)}"`,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let cuerpo: { tipo?: unknown; filas?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo no válido" }, { status: 400 });
  }

  const tipo = cuerpo.tipo === "entrenador" ? "entrenador" : "arbitro";
  const filas = Array.isArray(cuerpo.filas) ? (cuerpo.filas as FilaEntrada[]) : [];
  if (filas.length === 0) {
    return NextResponse.json({ error: "No hay filas que generar" }, { status: 400 });
  }
  if (filas.length > 100) {
    return NextResponse.json({ error: "Máximo 100 resguardos por lote" }, { status: 400 });
  }

  // Validar todas las filas antes de generar nada.
  const datos: DatosResguardo[] = [];
  for (let i = 0; i < filas.length; i++) {
    const r = validarFila(filas[i], tipo);
    if (typeof r === "string") {
      return NextResponse.json({ error: `Fila ${i + 1}: ${r}` }, { status: 400 });
    }
    datos.push(r);
  }

  // Registrar personas y pagos. Si falla el guardado, no se generan PDFs:
  // el resguardo impreso siempre tiene su registro en la base de datos.
  // El DNI llega ya normalizado a mayúsculas desde validarFila.
  const admin = createAdminClient();
  for (const d of datos) {
    const { data: existente, error: errBusqueda } = await admin
      .from("personas_pago")
      .select("id, nombre")
      .eq("dni", d.dni)
      .eq("tipo", d.tipo)
      .maybeSingle();
    if (errBusqueda) {
      return NextResponse.json({ error: `No se pudo registrar a ${d.nombre}` }, { status: 500 });
    }

    let personaId = existente?.id;
    if (existente) {
      // Actualiza el nombre por si ha cambiado la forma de escribirlo.
      if (existente.nombre !== d.nombre) {
        await admin.from("personas_pago").update({ nombre: d.nombre }).eq("id", existente.id);
      }
    } else {
      const { data: nueva, error: errAlta } = await admin
        .from("personas_pago")
        .insert({ nombre: d.nombre, dni: d.dni, tipo: d.tipo })
        .select("id")
        .single();
      if (errAlta || !nueva) {
        return NextResponse.json({ error: `No se pudo registrar a ${d.nombre}` }, { status: 500 });
      }
      personaId = nueva.id;
    }

    const { error: errPago } = await admin.from("resguardos").insert({
      persona_id: personaId,
      importe_cents: d.importeCents,
      concepto: d.concepto,
      fecha: d.fecha,
    });
    if (errPago) {
      return NextResponse.json(
        { error: `No se pudo registrar el pago de ${d.nombre}` },
        { status: 500 },
      );
    }
  }

  const escudo = new Uint8Array(
    await readFile(path.join(process.cwd(), "public", "escudo.png")),
  );

  // Un solo resguardo → PDF directo.
  if (datos.length === 1) {
    const pdf = await generarResguardoPDF(datos[0], escudo);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivoResguardo(datos[0])}"`,
      },
    });
  }

  // Lote → ZIP con un PDF por persona.
  const zip = new JSZip();
  const usados = new Set<string>();
  for (const d of datos) {
    const pdf = await generarResguardoPDF(d, escudo);
    let nombre = nombreArchivoResguardo(d);
    // Evita sobrescribir si dos filas generan el mismo nombre de archivo.
    let n = 2;
    while (usados.has(nombre)) {
      nombre = nombreArchivoResguardo(d).replace(/\.pdf$/, `-${n++}.pdf`);
    }
    usados.add(nombre);
    zip.file(nombre, pdf);
  }
  const zipBytes = await zip.generateAsync({ type: "uint8array" });

  const hoy = new Date().toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(zipBytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="resguardos-${tipo}s-${hoy}.zip"`,
    },
  });
}
