// Configuración de Sanity leída desde variables de entorno.
// Si falta el Project ID se usa "placeholder" para que la web arranque
// igualmente; el contenido de Sanity quedará vacío hasta configurarlo.
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";

// True solo cuando hay un Project ID real configurado.
export const isSanityConfigured = projectId !== "placeholder";
