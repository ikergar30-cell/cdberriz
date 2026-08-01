// Crea la noticia "Fechas de inicio de la pretemporada 2026/2027".
// Uso: node --env-file=.env.local scripts/crear-noticia-pretemporada-2627.mjs
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

function item(texto) {
  return {
    _type: "block",
    _key: newKey(),
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs: [],
    children: [{ _type: "span", _key: newKey(), text: texto, marks: [] }],
  };
}

const tituloEs = "Fechas de inicio de la pretemporada 2026/2027";
const tituloEu = "2026/2027 denboraldi-aurrearen hasiera-datak";

const doc = {
  _type: "noticia",
  titulo: { es: tituloEs, eu: tituloEu },
  slug: { _type: "slug", current: slugify(tituloEs) },
  categoria: "club",
  fecha: new Date().toISOString(),
  extracto: {
    es: "El C.D. Berriz confirma las fechas de arranque de la pretemporada 2026/2027 para sus equipos.",
    eu: "C.D. Berrizek 2026/2027 denboraldi-aurrearen hasiera-datak berretsi ditu bere taldeentzat.",
  },
  cuerpo: {
    es: [
      parrafo(
        "Cada vez queda menos. Ya lo sabemos: tenemos ganas de volver, de vivir esos sábados y domingos de partido en Berrizburu, de sentir otra vez ese ambiente que solo se vive aquí. Una temporada ilusionante está por venir, y el C.D. Berriz ya empieza a preparar el terreno.",
      ),
      parrafo("Estas son las fechas confirmadas de cara a la pretemporada 2026/2027:"),
      item("Regional, Juvenil A/B y Cadete A/B: 31 de agosto"),
      item("Deporte Escolar: 7 de septiembre"),
      parrafo("Queda menos. Y las ganas, cada día, son más."),
    ],
    eu: [
      parrafo(
        "Gero eta gutxiago falta da. Badakigu: itzultzeko gogoz gaude, Berrizburun larunbat eta igande hauetako partidak bizitzeko, hemen bakarrik bizi den giro hori berriz sentitzeko. Denboraldi ilusionagarri bat dator, eta C.D. Berriz dagoeneko lurra prestatzen hasi da.",
      ),
      parrafo("Hauek dira 2026/2027 denboraldi-aurrerako berretsitako datak:"),
      item("Erregionala, Gazte A/B eta Kadete A/B: abuztuaren 31"),
      item("Eskola Kirola: irailaren 7a"),
      parrafo("Gero eta gutxiago falta da. Eta gogoa, egunetik egunera, handiagoa da."),
    ],
  },
  destacada: false,
};

const creado = await client.create(doc);
console.log("✅ Noticia creada:", creado._id);
console.log(
  `\nAbre esta URL para añadir la foto de portada:\nhttps://cdberriz.com/studio/structure/noticia;${creado._id}`,
);
