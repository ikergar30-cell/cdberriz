// Crea la noticia "Situación del equipo Regional de cara a la 2026/2027".
// Uso: node --env-file=.env.local scripts/crear-noticia-regional-2026.mjs
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

const tituloEs = "Situación del equipo Regional C.D. Berriz de cara a la temporada 2026/2027";
const tituloEu = "C.D. Berriz Regional taldearen egoera 2026/2027 denboraldirako";

const doc = {
  _type: "noticia",
  titulo: { es: tituloEs, eu: tituloEu },
  slug: { _type: "slug", current: slugify(tituloEs) },
  categoria: "primer-equipo",
  fecha: new Date().toISOString(),
  extracto: {
    es: "Los siguientes jugadores no continuarán en el equipo la próxima temporada: Adri, Cordoba, Mikel, Gorka, Abdulai, Oier y Jon.",
    eu: "Hurrengo jokalariek ez dute jarraituko hurrengo denboraldian taldean: Adri, Cordoba, Mikel, Gorka, Abdulai, Oier eta Jon.",
  },
  cuerpo: {
    es: [
      parrafo(
        "Los siguientes jugadores no continuarán en el equipo la próxima temporada: Adri, Cordoba, Mikel, Gorka, Abdulai, Oier y Jon.",
      ),
      parrafo("Gracias por todo lo aportado esta temporada y mucha suerte en la siguiente etapa."),
    ],
    eu: [
      parrafo(
        "Hurrengo jokalariek ez dute jarraituko hurrengo denboraldian taldean: Adri, Cordoba, Mikel, Gorka, Abdulai, Oier eta Jon.",
      ),
      parrafo("Eskerrik asko emandako guztiagatik eta zorte on hurrengo etapan."),
    ],
  },
  destacada: false,
};

const creado = await client.create(doc);
console.log("✅ Noticia creada:", creado._id);
console.log(
  `\nAbre esta URL para añadir la foto de portada:\nhttps://cdberriz.com/studio/structure/noticia;${creado._id}`,
);
