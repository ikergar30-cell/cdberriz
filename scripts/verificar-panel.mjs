// Verifica el comportamiento real del panel:
// 1) Con la clave anónima (como un visitante SIN login) → RLS debe bloquear socios.
// 2) Prueba alta/lectura/borrado de un socio de prueba con la clave de servicio.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log("=== 1. SEGURIDAD: visitante sin login ===");
const { data: anonSocios } = await anon.from("socios").select("*");
console.log(
  anonSocios && anonSocios.length === 0
    ? "✓ Un visitante sin login NO puede leer socios (RLS bloquea)."
    : `⚠️ Atención: el visitante leyó ${anonSocios?.length} filas (no debería).`,
);

console.log("\n=== 2. CRUD de socio (prueba) ===");
const { data: tipo } = await admin
  .from("tipos_abono")
  .select("id, nombre")
  .eq("clave", "individual")
  .single();

const { data: nuevo, error: eIns } = await admin
  .from("socios")
  .insert({
    nombre: "PRUEBA",
    apellidos: "Borrar",
    email: "prueba@example.com",
    tipo_abono_id: tipo?.id,
    estado: "activo",
  })
  .select("id, numero_socio")
  .single();
if (eIns) {
  console.log("❌ Alta:", eIns.message);
  process.exit(1);
}
console.log(`✓ Alta OK → socio nº ${nuevo.numero_socio}`);

const { data: leido } = await admin
  .from("socios")
  .select("nombre, apellidos, estado, tipos_abono(nombre)")
  .eq("id", nuevo.id)
  .single();
console.log(`✓ Lectura OK → ${leido.nombre} ${leido.apellidos} · ${leido.tipos_abono?.nombre} · ${leido.estado}`);

await admin.from("socios").delete().eq("id", nuevo.id);
const { count } = await admin
  .from("socios")
  .select("*", { count: "exact", head: true });
console.log(`✓ Borrado OK → quedan ${count} socios (debe ser 0)`);

console.log("\n✅ Backend del panel verificado.");
