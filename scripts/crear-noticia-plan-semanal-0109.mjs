// Crea la noticia del plan semanal del primer equipo (31 ago - 6 sep 2026).
// Uso: node --env-file=.env.local scripts/crear-noticia-plan-semanal-0109.mjs
import { readFileSync } from "node:fs";
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

const RUTA_PORTADA = process.argv[2];

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

// Ítem de lista con el día en negrita: "Lunes: entrenamiento a las 19:45".
function item(dia, resto) {
  return {
    _type: "block",
    _key: newKey(),
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs: [],
    children: [
      { _type: "span", _key: newKey(), text: dia, marks: ["strong"] },
      { _type: "span", _key: newKey(), text: resto, marks: [] },
    ],
  };
}

const tituloEs = "Plan semanal del primer equipo (31 de agosto – 6 de septiembre)";
const tituloEu = "Lehen taldearen asteko lana (abuztuak 31 – irailak 6)";
const slug = "plan-semanal-primer-equipo-31-agosto-6-septiembre";

const doc = {
  _type: "noticia",
  titulo: { es: tituloEs, eu: tituloEu },
  slug: { _type: "slug", current: slug },
  categoria: "primer-equipo",
  fecha: new Date().toISOString(),
  extracto: {
    es: "Cuatro entrenamientos, dos días de descanso y partido el sábado a las 17:00 en Ibarra Zelaia ante el Berriatu F.T.",
    eu: "Lau entrenamendu, bi atseden-egun eta partidua larunbatean, 17:00etan, Ibarra Zelaian, Berriatu F.T.-ren aurka.",
  },
  cuerpo: {
    es: [
      parrafo(
        "Arranca la semana para el primer equipo del C.D. Berriz. Este es el trabajo previsto de lunes a domingo: cuatro sesiones de entrenamiento, dos días de descanso y una cita el sábado, la primera del fin de semana.",
      ),
      item("Lunes", ": entrenamiento a las 19:45."),
      item("Martes", ": entrenamiento a las 19:45."),
      item("Miércoles", ": entrenamiento a las 19:45."),
      item("Jueves", ": día de descanso."),
      item("Viernes", ": entrenamiento a las 19:45."),
      item("Sábado", ": día de partido. Ibarra Zelaia, 17:00, ante el Berriatu F.T."),
      item("Domingo", ": día de descanso."),
      parrafo(
        "El sábado nos desplazamos a Ibarra Zelaia. Quien pueda acercarse, que se acerque: se agradece cada voz desde la banda. ¡Aupa Berriz!",
      ),
    ],
    eu: [
      parrafo(
        "C.D. Berrizeko lehen taldearentzat astea hasi da. Hau da astelehenetik igandera aurreikusitako lana: lau entrenamendu-saio, bi atseden-egun eta larunbateko hitzordua, asteburuko lehena.",
      ),
      item("Astelehena", ": entrenamendua 19:45ean."),
      item("Asteartea", ": entrenamendua 19:45ean."),
      item("Asteazkena", ": entrenamendua 19:45ean."),
      item("Osteguna", ": atseden eguna."),
      item("Ostirala", ": entrenamendua 19:45ean."),
      item("Larunbata", ": partidu eguna. Ibarra Zelaia, 17:00, Berriatu F.T.-ren aurka."),
      item("Igandea", ": atseden eguna."),
      parrafo(
        "Larunbatean Ibarra Zelaiara joango gara. Hurbildu ahal denak, hurbildu dadila: bandatik datorren ahots bakoitza eskertzen da. Aupa Berriz!",
      ),
    ],
  },
  destacada: false,
};

if (RUTA_PORTADA) {
  const asset = await client.assets.upload("image", readFileSync(RUTA_PORTADA), {
    filename: "asteko-lana-31-agosto-2026.jpg",
  });
  doc.portada = {
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
    alt: "Plan semanal del primer equipo del C.D. Berriz",
  };
  console.log("🖼️  Portada subida:", asset._id);
}

const creado = await client.create(doc);
console.log("✅ Noticia creada:", creado._id);
console.log(`\nhttps://cdberriz.com/es/noticias/${slug}`);
console.log(`Editar: https://cdberriz.com/studio/structure/noticia;${creado._id}`);
