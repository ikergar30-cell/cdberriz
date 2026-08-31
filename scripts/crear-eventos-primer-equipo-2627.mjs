// Crea los eventos del primer equipo para la temporada 2026/2027:
//  - 7 amistosos de pretemporada (cartel "Aurredenboraldia")
//  - 24 partidos de liga (Tercera División 3ª / Hirugarren Maila, Grupo 3)
//    Fuente: calendario oficial de la FVF-BFF. Las jornadas 1 y 14 el Berriz
//    descansa, así que no generan evento.
//
// La FVF solo publica la fecha de la jornada, no la hora. Guardamos las 12:00
// como marcador (la hora no se muestra en la web: ni la portada ni el panel de
// socio la pintan) y lo dejamos dicho en la descripción.
//
// Uso: node --env-file=.env.local scripts/crear-eventos-primer-equipo-2627.mjs
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

const BERRIZ = "C.D. Berriz";
const CAMPO = "Berrizburu";

// 12:00 hora local (Europe/Madrid, +02:00 en verano / +01:00 en invierno).
// Se fija el desfase a mano para que la fecha no se desplace un día según la
// zona horaria del servidor que renderiza la portada.
function fechaSinHora(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  const verano = m > 3 && m < 11; // aproximación suficiente: aquí solo hay
  return `${iso}T12:00:00${verano ? "+02:00" : "+01:00"}`; // fechas de oct a abr
}

const SIN_HORA = {
  es: "Hora por confirmar: la federación aún no ha publicado el horario.",
  eu: "Ordua zehazteke: federazioak oraindik ez du ordutegia argitaratu.",
};

// ---------------------------------------------------------------- PRETEMPORADA
// Del cartel "Aurredenboraldia 26/27". Las fechas dobles (12/13, 19/20…) se
// fijan en el sábado y se avisa en el título de que están sin confirmar.
const amistosos = [
  {
    id: "amistoso-berriatu",
    fecha: "2026-09-05T17:00:00+02:00",
    rival: { es: "Berriatu F.T.", eu: "Berriatuko F.T." },
    lugar: "Ibarra Zelaia (Berriatua)",
    porConfirmar: false,
  },
  { id: "amistoso-ermua", fecha: fechaSinHora("2026-09-09"), rival: { es: "Ermua C.D.", eu: "Ermua C.D." }, porConfirmar: false },
  { id: "amistoso-zaldua", fecha: fechaSinHora("2026-09-12"), rival: { es: "Zaldua K.E.", eu: "Zaldua K.E." }, porConfirmar: true },
  { id: "amistoso-rio-nela", fecha: fechaSinHora("2026-09-19"), rival: { es: "Deportivo Río Nela", eu: "Deportivo Río Nela" }, porConfirmar: true },
  { id: "amistoso-pauldarrak", fecha: fechaSinHora("2026-09-26"), rival: { es: "Pauldarrak F.K.T.", eu: "Pauldarrak F.K.T." }, porConfirmar: true },
  { id: "amistoso-aurrera", fecha: fechaSinHora("2026-10-03"), rival: { es: "Aurrera de Ondarroa", eu: "Ondarroako Aurrera" }, porConfirmar: true },
  { id: "amistoso-union-latina", fecha: fechaSinHora("2026-10-10"), rival: { es: "Unión Latina", eu: "Unión Latina" }, porConfirmar: true },
];

// ----------------------------------------------------------------------- LIGA
// [jornada, fecha, rival, local]
const liga = [
  [2, "2026-10-25", "Lekeitio B", true],
  [3, "2026-11-01", "Zorrontzako", false],
  [4, "2026-11-08", "Ermua B", true],
  [5, "2026-11-15", "Aurrera de Ondarroa B", false],
  [6, "2026-11-22", "Vulcano", true],
  [7, "2026-11-29", "Gernika Sporting B", false],
  [8, "2026-12-06", "Gernika B", true],
  [9, "2026-12-13", "Iurretako B", false],
  [10, "2026-12-20", "Durangoko Sapuherriak", true],
  [11, "2027-01-03", "Zaldua B", false],
  [12, "2027-01-10", "Berriatuko", true],
  [13, "2027-01-17", "Elorrio B", false],
  [15, "2027-01-31", "Lekeitio B", false],
  [16, "2027-02-07", "Zorrontzako", true],
  [17, "2027-02-14", "Ermua B", false],
  [18, "2027-02-21", "Aurrera de Ondarroa B", true],
  [19, "2027-02-28", "Vulcano", false],
  [20, "2027-03-07", "Gernika Sporting B", true],
  [21, "2027-03-14", "Gernika B", false],
  [22, "2027-03-21", "Iurretako B", true],
  [23, "2027-04-04", "Durangoko Sapuherriak", false],
  [24, "2027-04-11", "Zaldua B", true],
  [25, "2027-04-18", "Berriatuko", false],
  [26, "2027-04-25", "Elorrio B", true],
];

// ------------------------------------------------------------ OTROS EVENTOS
const otros = [
  {
    _id: "evento-presentacion-equipos-2627",
    _type: "evento",
    titulo: {
      es: "Presentación de equipos del C.D. Berriz",
      eu: "C.D. Berrizeko taldeen aurkezpena",
    },
    tipo: "club",
    fecha: "2026-09-27T16:30:00+02:00",
    lugar: "Berrizburu Futbol Zelaia",
    descripcion: {
      es: "Presentación de todos los equipos del club para la temporada 2026/2027.",
      eu: "Klubeko talde guztien aurkezpena, 2026/2027 denboraldirako.",
    },
  },
];

const docs = [...otros];

for (const a of amistosos) {
  const aviso = a.porConfirmar ? { es: " (fecha por confirmar)", eu: " (data zehazteke)" } : { es: "", eu: "" };
  docs.push({
    _id: `evento-${a.id}-2627`,
    _type: "evento",
    tipo: "partido",
    titulo: {
      es: `Amistoso ante el ${a.rival.es}${aviso.es}`,
      eu: `Lagunartekoa ${a.rival.eu}-ren aurka${aviso.eu}`,
    },
    fecha: a.fecha,
    ...(a.lugar ? { lugar: a.lugar } : {}),
    descripcion: {
      es: `Partido de pretemporada 2026/2027 del primer equipo.${a.porConfirmar ? " Día sin confirmar (el cartel indica sábado o domingo)." : ""}`,
      eu: `Lehen taldearen 2026/2027 denboraldi-aurreko partidua.${a.porConfirmar ? " Eguna zehazteke (kartelak larunbata edo igandea dio)." : ""}`,
    },
  });
}

for (const [jornada, fecha, rival, local] of liga) {
  const enfrentamiento = local ? `${BERRIZ} - ${rival}` : `${rival} - ${BERRIZ}`;
  docs.push({
    _id: `evento-liga-j${jornada}-2627`,
    _type: "evento",
    tipo: "partido",
    titulo: {
      es: `Jornada ${jornada}: ${enfrentamiento}`,
      eu: `${jornada}. jardunaldia: ${enfrentamiento}`,
    },
    fecha: fechaSinHora(fecha),
    ...(local ? { lugar: CAMPO } : {}),
    descripcion: {
      es: `Tercera División 3ª, Grupo 3. ${SIN_HORA.es}`,
      eu: `Hirugarren Maila, 3. taldea. ${SIN_HORA.eu}`,
    },
  });
}

// createIfNotExists: si mañana retocas un evento a mano en el Studio, volver a
// lanzar el script no te lo pisa.
let creados = 0;
let existentes = 0;
for (const doc of docs) {
  const antes = await client.getDocument(doc._id);
  await client.createIfNotExists(doc);
  if (antes) existentes++;
  else creados++;
}

console.log(`✅ ${creados} eventos creados, ${existentes} ya existían.`);
console.log(
  `   ${otros.length} acto${otros.length === 1 ? "" : "s"} del club + ${amistosos.length} amistosos + ${liga.length} partidos de liga.`,
);
