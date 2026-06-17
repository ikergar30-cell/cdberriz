// Mapea el valor de categoría guardado en Sanity a la clave de traducción.
export const CATEGORIA_KEY: Record<string, string> = {
  cantera: "cantera",
  club: "club",
  "primer-equipo": "primerEquipo",
  socios: "socios",
};

export const CATEGORIAS = ["cantera", "club", "primer-equipo", "socios"] as const;
