// Importa el listado de árbitros al padrón de resguardos (sin equipo/importe:
// los árbitros cobran variable por partido). Idempotente: no duplica por DNI.
//   node --env-file=.env.local scripts/importar-arbitros.mjs --dry
//   node --env-file=.env.local scripts/importar-arbitros.mjs
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// nombre | DNI (tal como venía en la hoja, con puntos y guión)
const ARBITROS = [
  ["OIER GONZALEZ", "45.947.543-Y"],
  ["LIER LEJARZABURU CAMPAÑON", "46.371.615-G"],
  ["EKAIN JUAREZ", "79.067.063-D"],
  ["ANDER RENEDO PARRA", "72.593.080-C"],
  ["JOSU SANTOS ARRIARAN", "79.243.379-F"],
  ["ENAR MANCHON GONZALEZ", "79.456.602-C"],
  ["OIER JUAREZ MARTIN", "79.067.061-F"],
  ["URKO SAN ANTONIO", "79.455.890-K"],
  ["DANEL MURILLO AZPIRI", "58.033.802-H"],
  ["ENDIKA DELGADO RODRIGUEZ", "46.369.993-S"],
  ["MAIA LION NARBAIZA URQUIZA", "72.855.899-H"],
  ["PERU FERNANDEZ DE LANDA MAIZTEGI", "45.950.227-E"],
];

// Sin DNI en la hoja original: no se pueden dar de alta (el DNI es obligatorio).
const SIN_DNI = ["OIER RIOS SAN CIPRIANO", "IKER GARCIA"];

let altas = 0;
let actualizados = 0;

for (const [nombre, dniRaw] of ARBITROS) {
  const dni = dniRaw.replace(/[.\-]/g, "").trim().toUpperCase();
  const fila = { nombre, dni, tipo: "arbitro" };

  const { data: existe, error: errBusca } = await db
    .from("personas_pago")
    .select("id")
    .eq("dni", dni)
    .eq("tipo", "arbitro")
    .maybeSingle();
  if (errBusca) {
    console.error(`❌ ${nombre}: ${errBusca.message}`);
    continue;
  }

  if (existe) {
    console.log(`  · ${nombre} → ya existe, se actualiza el nombre`);
    if (!DRY) await db.from("personas_pago").update(fila).eq("id", existe.id);
    actualizados++;
  } else {
    console.log(`  + ${nombre} (${dni})`);
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

if (SIN_DNI.length) {
  console.log(
    `\n⚠️  Sin DNI en la hoja, NO se han importado: ${SIN_DNI.join(", ")}. ` +
      `Añádelos manualmente desde la intranet cuando tengas su DNI.`,
  );
}
