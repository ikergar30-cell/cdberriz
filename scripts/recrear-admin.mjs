// Borra (si existe) y vuelve a crear un usuario administrador en Supabase Auth + perfiles.
// Uso: node --env-file=.env.local scripts/recrear-admin.mjs <email> <contraseña> [nombre]
import { createClient } from "@supabase/supabase-js";

const [, , email, password, nombre = "Administración"] = process.argv;

if (!email || !password) {
  console.error("Uso: node --env-file=.env.local scripts/recrear-admin.mjs <email> <contraseña> [nombre]");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// 1. Buscar si ya existe el usuario
const { data: lista } = await db.auth.admin.listUsers();
const existente = lista?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (existente) {
  const { error } = await db.auth.admin.deleteUser(existente.id);
  if (error) { console.error("❌ No se pudo borrar:", error.message); process.exit(1); }
  console.log(`🗑  Usuario ${email} eliminado.`);
}

// 2. Crear usuario nuevo
const { data: nuevo, error: e2 } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (e2 || !nuevo?.user) { console.error("❌ No se pudo crear:", e2?.message); process.exit(1); }
console.log(`✓  Usuario ${email} creado (id: ${nuevo.user.id})`);

// 3. Crear perfil de empleado/admin
const { error: e3 } = await db
  .from("perfiles")
  .upsert({ id: nuevo.user.id, nombre, rol: "admin" }, { onConflict: "id" });
if (e3) { console.error("❌ No se pudo crear el perfil:", e3.message); process.exit(1); }

console.log(`✓  Perfil admin creado → "${nombre}" (${email})`);
console.log(`\n   Ya puedes entrar en /admin con esas credenciales.`);
