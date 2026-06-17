import type { LocaleString } from "@/sanity/lib/types";

// Devuelve el texto en el idioma activo, con respaldo al otro idioma.
export function pickLocale(
  field: LocaleString | undefined | null,
  locale: string,
): string {
  if (!field) return "";
  const key = locale === "eu" ? "eu" : "es";
  return field[key] || field.es || field.eu || "";
}
