// Importa el cuadro técnico (entrenadores y staff) al padrón de resguardos,
// con su equipo e importe mensual fijo. Idempotente: no duplica por DNI.
//   node --env-file=.env.local scripts/importar-entrenadores.mjs --dry
//   node --env-file=.env.local scripts/importar-entrenadores.mjs
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// nombre | DNI | equipo | importe (euros/mes)
const ENTRENADORES = [
  ["ANTONIO MARQUEZ LOPEZ", "30597079H", "ENTRENADOR PORTEROS", 375],
  ["ASIER SANCHEZ FERNANDEZ", "22655925L", "MASAJISTA", 360],
  ["RAUL PEREIRA GOMEZ", "72318254K", "PREPARADOR FISICO", 150],
  ["KEPA URIARTE ARRESE", "30655471J", "REGIONAL", 400],
  ["JUSTO PERERA FIGUEREDO", "30635742H", "JUVENIL", 230],
  ["IKER GARCIA HIDALGO", "72593129T", "CADETE", 220],
  ["IKER RODRIGUEZ VILA", "45947543Y", "INFANTIL URDIN", 200],
  ["DAVID LOPEZ RUIZ", "45167964N", "INFANTIL GORRI", 200],
  ["DIEGO NOGALES ENRIQUE", "15387656N", "ALEVIN 2014", 140],
  ["BORJA CRESPO TRUJILLO", "72312487G", "ALEVIN 2015", 140],
  ["AMETS AULESTIARTE EGUREN", "79181054N", "BENJAMIN 2016", 140],
  ["JESUS MARIA MERINO SIERRA", "15365620X", "BENJAMIN 2017", 140],
  ["MARTA NARBAIZA URQUIZA", "15386648Q", "BENJAMIN NESKAK", 140],
  ["MANUEL VARGAS NUÑEZ", "15357311G", "FUTBOL ESKOLA", 140],
  ["LOREA LASKURAIN VIGUERA", "79367381Q", "MINIBASKET", 140],
  ["JUNE ZABALA", "70945155E", "PREMINI", 140],
];

let altas = 0;
let actualizados = 0;

for (const [nombre, dni, equipo, importe] of ENTRENADORES) {
  const dniNorm = dni.trim().toUpperCase();
  const fila = {
    nombre,
    dni: dniNorm,
    tipo: "entrenador",
    equipo,
    importe_cents: Math.round(importe * 100),
  };

  // ¿Ya existe por DNI + tipo?
  const { data: existe, error: errBusca } = await db
    .from("personas_pago")
    .select("id")
    .eq("dni", dniNorm)
    .eq("tipo", "entrenador")
    .maybeSingle();
  if (errBusca) {
    console.error(`❌ ${nombre}: ${errBusca.message}`);
    continue;
  }

  if (existe) {
    console.log(`  · ${nombre} → ya existe, se actualiza equipo/importe`);
    if (!DRY) await db.from("personas_pago").update(fila).eq("id", existe.id);
    actualizados++;
  } else {
    console.log(`  + ${nombre} (${equipo}, ${importe} €)`);
    if (!DRY) {
      const { error } = await db.from("personas_pago").insert(fila);
      if (error) {
        console.error(`❌ ${nombre}: ${error.message}`);
        continue;
      }
    }
    altas++;
  }
}

console.log(
  DRY
    ? `\n(Prueba) Se darían de alta ${altas} y se actualizarían ${actualizados}.`
    : `\n✅ Alta: ${altas} · Actualizados: ${actualizados}.`,
);
