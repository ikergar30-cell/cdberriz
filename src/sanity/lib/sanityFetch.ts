import { client } from "../client";
import { isSanityConfigured } from "../env";

// Lectura segura de datos de Sanity. Si Sanity no está configurado o la
// consulta falla, devuelve un valor por defecto en vez de romper la página.
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: T,
): Promise<T> {
  if (!isSanityConfigured) return fallback;
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: 60 },
    });
  } catch {
    console.warn("[sanity] La consulta falló; se usan datos por defecto.");
    return fallback;
  }
}
