// Crea la noticia "La SD Eibar ficha a dos jugadores formados en el Berriz".
// Uso: node --env-file=.env.local scripts/crear-noticia-fichajes-eibar.mjs
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

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

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

const tituloEs = "La SD Eibar ficha a dos jugadores formados en el Berriz: Olivia y Hegoi";
const tituloEu = "SD Eibarrek Berrizen hezitako bi jokalari fitxatu ditu: Olivia eta Hegoi";

const doc = {
  _type: "noticia",
  titulo: { es: tituloEs, eu: tituloEu },
  slug: { _type: "slug", current: slugify(tituloEs) },
  categoria: "cantera",
  fecha: new Date().toISOString(),
  extracto: {
    es: "Olivia y Hegoi, formados en las categorías inferiores del C.D. Berriz, dan el salto a la SD Eibar.",
    eu: "Olivia eta Hegoi, C.D. Berrizeko maila txikietan hezitakoak, jauzia eman dute SD Eibarrera.",
  },
  cuerpo: {
    es: [
      parrafo(
        "Es la confirmación de un trabajo de cantera bien hecho, y una alegría verlos dar el salto juntos.",
      ),
      parrafo("Enhorabuena a los dos. Seguiremos vuestros pasos de cerca."),
      parrafo("Aquí siempre tendréis vuestra casa."),
    ],
    eu: [
      parrafo("Ondo egindako harrobi-lanaren berrespena da, eta poz handia da biak batera jauzia ematen ikustea."),
      parrafo("Zorionak bioi. Gertutik jarraituko dizuegu."),
      parrafo("Hemen beti izango duzue zuen etxea."),
    ],
  },
  destacada: true,
};

const creado = await client.create(doc);
console.log("✅ Noticia creada:", creado._id);
console.log(
  `\nAbre esta URL para añadir la foto de portada:\nhttps://cdberriz.com/studio/structure/noticia;${creado._id}`,
);
