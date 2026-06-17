// Da permisos de empleado/admin a un usuario de login ya creado en Supabase Auth.
// Uso: node --env-file=.env.local scripts/crear-admin.mjs <email> [nombre] [rol]
import { createClient } from "@supabase/supabase-js";

const [, , emailArg, nombreArg, rolArg] = process.argv;
const email = emailArg;
const nombre = nombreArg || "Administración";
const rol = rolArg || "admin";

if (!email) {
  console.error("Uso: node scripts/crear-admin.mjs <email> [nombre] [rol]");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Busca el id del usuario de login por email.
const { data: lista, error: e1 } = await db.auth.admin.listUsers();
if (e1) {
  console.error("❌", e1.message);
  process.exit(1);
}
const usuario = lista.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!usuario) {
  console.error(`❌ No existe un usuario de login con email ${email}`);
  process.exit(1);
}

// Crea (o actualiza) el perfil de empleado.
const { error: e2 } = await db
  .from("perfiles")
  .upsert({ id: usuario.id, nombre, rol }, { onConflict: "id" });
if (e2) {
  console.error("❌", e2.message);
  process.exit(1);
}

console.log(`✓ ${email} → empleado "${nombre}" (rol: ${rol})`);
