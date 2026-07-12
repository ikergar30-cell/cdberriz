// Corrige "se une" -> "se unen" en el título de la noticia de fichajes Eibar.
// Uso: node --env-file=.env.local scripts/corregir-titulo-noticia-eibar.mjs
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("❌ Falta SANITY_API_WRITE_TOKEN en .env.local");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token,
});

const id = "lrOVZGsnmeTsDxDUcHZLGC";

const actualizado = await client
  .patch(id)
  .set({ "titulo.es": "Nuestros jugadores Olivia y Hegoi se unen a la SD Eibar" })
  .commit();

console.log("✅ Título corregido:", actualizado.titulo.es);
