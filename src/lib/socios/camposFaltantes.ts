import type { Socio } from "@/lib/supabase/types";

// Campos que deberían estar rellenos en todo socio (obligatorios en el alta
// online desde julio de 2026), pero que socios antiguos o importados pueden
// tener vacíos. Se usa para avisar al personal en el listado y en la ficha.
const CAMPOS_REQUERIDOS: { clave: keyof Socio; etiqueta: string }[] = [
  { clave: "email", etiqueta: "Email" },
  { clave: "telefono", etiqueta: "Teléfono" },
  { clave: "dni", etiqueta: "DNI" },
  { clave: "direccion", etiqueta: "Dirección" },
  { clave: "poblacion", etiqueta: "Población" },
  { clave: "codigo_postal", etiqueta: "Código postal" },
  { clave: "fecha_nacimiento", etiqueta: "Fecha de nacimiento" },
];

export function camposFaltantes(
  socio: Partial<Pick<Socio, "email" | "telefono" | "dni" | "direccion" | "poblacion" | "codigo_postal" | "fecha_nacimiento">>,
): string[] {
  return CAMPOS_REQUERIDOS.filter((c) => !socio[c.clave as keyof typeof socio]).map((c) => c.etiqueta);
}
