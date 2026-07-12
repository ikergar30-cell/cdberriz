// Actualiza el cuerpo (es/eu) de la noticia de fichajes Eibar (Olivia y Hegoi)
// con el tono usado para el anuncio de Luar Goñi Ortuzar.
// Uso: node --env-file=.env.local scripts/actualizar-cuerpo-noticia-eibar.mjs
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
  return () => "k" + (n++).toString(36);
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

const cuerpoEs = [
  parrafo(
    "Dos de los nuestros, Olivia y Hegoi, comenzarán una nueva etapa la próxima temporada en la SD Eibar.",
  ),
  parrafo(
    "Desde el Club Deportivo Berriz queremos felicitarles por esta gran oportunidad. Es el reflejo del esfuerzo, la humildad y las ganas que han demostrado cada día.",
  ),
];

const cuerpoEu = [
  parrafo(
    "Gureetako bi, Olivia eta Hegoi, datorren denboraldian etapa berri bati ekingo diote SD Eibarren.",
  ),
  parrafo(
    "C.D. Berriztik zorionak eman nahi dizkiegu aukera bikain honengatik. Egunero erakutsi duten ahalegin, apaltasun eta gogoaren isla da.",
  ),
];

const actualizado = await client
  .patch(id)
  .set({
    cuerpo: { es: cuerpoEs, eu: cuerpoEu },
    extracto: {
      es: "Olivia y Hegoi, formados en la cantera del C.D. Berriz, comienzan una nueva etapa en la SD Eibar.",
      eu: "Olivia eta Hegoi, C.D. Berrizko harrobian hezitakoak, etapa berri bati ekingo diote SD Eibarren.",
    },
  })
  .commit();

console.log("✅ Cuerpo actualizado para:", actualizado._id);
