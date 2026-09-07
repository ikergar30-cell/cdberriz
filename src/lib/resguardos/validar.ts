import type { DatosResguardo } from "@/lib/resguardos/pdf";

// Validación de las filas del formulario de resguardos, compartida entre la
// generación en lote (route.ts) y la generación con firma (firmar/route.ts).

export type FilaEntrada = {
  nombre?: unknown;
  dni?: unknown;
  importe?: unknown; // euros, p.ej. "40" o "40,50"
  concepto?: unknown; // partido (árbitros) o mes "YYYY-MM" (entrenadores)
  fecha?: unknown; // "YYYY-MM-DD"
};

export function parsearImporteCents(v: unknown): number | null {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function validarFila(
  fila: FilaEntrada,
  tipo: "arbitro" | "entrenador",
): DatosResguardo | string {
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
