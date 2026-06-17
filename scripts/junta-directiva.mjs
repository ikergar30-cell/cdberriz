// Carga la Junta Directiva actual en Sanity (singleton "juntaDirectiva").
// Uso: node --env-file=.env.local scripts/junta-directiva.mjs
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
  useCdn: false,
});

const CARGO = {
  presidenta: { es: "Presidenta", eu: "Lehendakaria" },
  vicepresidente: { es: "Vicepresidente", eu: "Lehendakariordea" },
  secretario: { es: "Secretario", eu: "Idazkaria" },
  tesorero: { es: "Tesorero", eu: "Diruzaina" },
  vocal: { es: "Vocal", eu: "Batzordekidea" },
};

const MIEMBROS = [
  ["Elena Rubio Rodríguez", "presidenta"],
  ["Asier Lasagabaster Silva", "vicepresidente"],
  ["Lander Loizate Erkiaga", "secretario"],
  ["Jose Antonio Marquez Naranjo", "tesorero"],
  ["Justo Jose Perera Figueredo", "vocal"],
  ["Kepa Aguirre Abaitua", "vocal"],
  ["Ainara García Rodríguez", "vocal"],
];

const doc = {
  _id: "juntaDirectiva",
  _type: "juntaDirectiva",
  miembros: MIEMBROS.map(([nombre, cargoKey], i) => ({
    _key: "m" + i,
    nombre,
    cargo: { _type: "localeString", ...CARGO[cargoKey] },
  })),
};

await client.createOrReplace(doc);
console.log(`✓ Junta Directiva actualizada en Sanity (${MIEMBROS.length} miembros):`);
MIEMBROS.forEach(([n, c]) => console.log(`  · ${CARGO[c].es}: ${n}`));
