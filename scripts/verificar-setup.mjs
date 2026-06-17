// Verifica que el esquema de Supabase está bien creado.
// Uso: node --env-file=.env.local scripts/verificar-setup.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function tabla(nombre) {
  const { error, count } = await db.from(nombre).select("*", { count: "exact", head: true });
  if (error) return `❌ ${nombre}: ${error.message}`;
  return `✓ ${nombre}: existe (${count} filas)`;
}

console.log("=== TABLAS ===");
for (const t of ["perfiles", "tipos_abono", "socios", "pagos"]) {
  console.log(await tabla(t));
}

console.log("\n=== CUOTAS ===");
const { data: cuotas, error: e1 } = await db
  .from("tipos_abono")
  .select("nombre, precio_cents")
  .order("orden");
if (e1) console.log("❌", e1.message);
else cuotas.forEach((c) => console.log(`  ${c.nombre}: ${(c.precio_cents / 100).toFixed(2)} €`));

console.log("\n=== EMPLEADOS (auth + perfiles) ===");
const { data: usuarios, error: e2 } = await db.auth.admin.listUsers();
if (e2) console.log("❌ auth:", e2.message);
else {
  console.log(`Usuarios de login creados: ${usuarios.users.length}`);
  usuarios.users.forEach((u) => console.log(`  - ${u.email} (id ${u.id.slice(0, 8)}…)`));
}
const { data: perfiles } = await db.from("perfiles").select("nombre, rol");
console.log(`Perfiles de empleado: ${perfiles?.length ?? 0}`);
perfiles?.forEach((p) => console.log(`  - ${p.nombre} (${p.rol})`));
