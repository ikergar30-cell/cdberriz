import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exporta el padrón de socios a CSV. Protegido por el middleware (/admin exige
// sesión) y por RLS (solo un empleado obtiene filas). Datos personales — RGPD.
export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const estado = request.nextUrl.searchParams.get("estado");

  let query = supabase
    .from("socios")
    .select(
      "numero_socio, nombre, apellidos, email, telefono, dni, direccion, poblacion, codigo_postal, fecha_nacimiento, estado, fecha_alta, tipos_abono(nombre)",
    )
    .order("numero_socio");
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }

  const filas = (data as unknown as Array<Record<string, unknown> & { tipos_abono: { nombre: string } | null }>) ?? [];

  const cabeceras = [
    "Nº socio", "Nombre", "Apellidos", "Email", "Teléfono", "DNI",
    "Dirección", "Población", "Código postal", "Fecha nacimiento", "Cuota", "Estado", "Fecha alta",
  ];

  // Escapa cada celda para CSV (comillas, comas, saltos de línea).
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lineas = filas.map((f) =>
    [
      f.numero_socio, f.nombre, f.apellidos, f.email, f.telefono, f.dni,
      f.direccion, f.poblacion, f.codigo_postal, f.fecha_nacimiento, f.tipos_abono?.nombre ?? "", f.estado, f.fecha_alta,
    ]
      .map(esc)
      .join(";"),
  );

  // BOM para que Excel reconozca los acentos en UTF-8.
  const csv = "﻿" + [cabeceras.join(";"), ...lineas].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="socios-cdberriz.csv"`,
    },
  });
}
