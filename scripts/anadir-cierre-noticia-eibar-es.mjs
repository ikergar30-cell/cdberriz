// Añade el cierre en castellano (la llamada anterior se sobrescribió porque
// @sanity/client solo admite un .append() por commit()).
// Uso: node --env-file=.env.local scripts/anadir-cierre-noticia-eibar-es.mjs
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

const newKey = (() => {
  let n = 0;
  return () => "kd" + (n++).toString(36);
})();

function parrafo(texto) {
  return {
    _type: "block",
    _key: newKey(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: newKey(), text: texto, marks: [] }],
  };
}

const id = "lrOVZGsnmeTsDxDUcHZLGC";

const cierreEs = [
  parrafo("Enhorabuena a los dos. Seguiremos vuestros pasos de cerca."),
  parrafo("Aquí siempre tendréis vuestra casa."),
];

const actualizado = await client.patch(id).append("cuerpo.es", cierreEs).commit();

console.log(
  "✅ cuerpo.es:",
  actualizado.cuerpo.es.map((b) => b.children?.map((c) => c.text).join("")),
);
