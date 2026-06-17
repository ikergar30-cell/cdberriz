// Importa al panel los socios que YA pagan en tu Stripe (modo real).
// Lee las suscripciones de tu cuenta (solo lectura) y crea/actualiza la ficha
// de cada socio en Supabase, enlazada por stripe_customer_id.
//
//   node --env-file=.env.local scripts/importar-socios-stripe.mjs --dry   (prueba, no escribe)
//   node --env-file=.env.local scripts/importar-socios-stripe.mjs         (importa de verdad)
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");

const keyLive = process.env.STRIPE_LIVE_READ_KEY;
if (!keyLive?.startsWith("rk_live_") && !keyLive?.startsWith("sk_live_")) {
  console.error("❌ STRIPE_LIVE_READ_KEY debe ser una clave LIVE (rk_live_…).");
  process.exit(1);
}
const stripe = new Stripe(keyLive);

// Mapea el nombre del producto / importe a nuestra clave de cuota.
function claveCuota(nombreProducto, importeCents) {
  const n = (nombreProducto || "").toLowerCase();
  if (n.includes("joven") || n.includes("gazte")) return "joven";
  if (n.includes("famili")) return "familiar";
  if (n.includes("jubil") || n.includes("erretir")) return "jubilado";
  if (n.includes("individual") || n.includes("banaka")) return "individual";
  // Sin pista por nombre → por importe (joven y jubilado coinciden en 25€).
  if (importeCents === 4000) return "individual";
  if (importeCents === 6000) return "familiar";
  if (importeCents === 2500) return "joven";
  return null;
}

// Suscripciones que NO son socios reales (alta empezada y nunca pagada).
const OMITIR = new Set(["incomplete", "incomplete_expired"]);

// Estado de la suscripción de Stripe → estado de socio nuestro.
function estadoSocio(status) {
  if (status === "active" || status === "trialing") return "activo";
  if (status === "past_due" || status === "unpaid") return "moroso";
  if (status === "canceled") return "baja";
  return "pendiente";
}

// Cache de nombres de producto.
const productos = {};
for await (const p of stripe.products.list({ limit: 100 })) productos[p.id] = p.name;

// Recorre TODAS las suscripciones (cualquier estado).
const registros = [];
for await (const sub of stripe.subscriptions.list({
  status: "all",
  limit: 100,
  expand: ["data.customer"],
})) {
  if (OMITIR.has(sub.status)) continue; // intentos fallidos: no son socios
  const item = sub.items.data[0];
  const precio = item?.price;
  const cust = sub.customer && typeof sub.customer === "object" ? sub.customer : null;
  if (!cust || cust.deleted) continue;

  const nombreCompleto = (cust.name || "").trim();
  const parted = nombreCompleto.split(/\s+/);
  const nombre = parted[0] || "(sin nombre)";
  const apellidos = parted.slice(1).join(" ") || "";

  registros.push({
    stripe_customer_id: cust.id,
    stripe_subscription_id: sub.id,
    nombre,
    apellidos,
    email: cust.email || null,
    telefono: cust.phone || null,
    clave: claveCuota(productos[precio?.product], precio?.unit_amount),
    importe: precio?.unit_amount,
    estado: estadoSocio(sub.status),
    statusStripe: sub.status,
  });
}

// Un cliente puede tener varias suscripciones: nos quedamos con el MEJOR estado
// (activo gana a moroso, que gana a baja). Así nadie con una activa queda en baja.
const PRIO = { activo: 1, moroso: 2, pendiente: 3, baja: 4 };
const porCliente = new Map();
for (const r of registros) {
  const prev = porCliente.get(r.stripe_customer_id);
  if (!prev || PRIO[r.estado] < PRIO[prev.estado]) porCliente.set(r.stripe_customer_id, r);
}
const totalSubs = registros.length;
registros.length = 0;
registros.push(...porCliente.values());

// --- Resumen ---
console.log(`\nSuscripciones: ${totalSubs} → Socios únicos: ${registros.length}\n`);
const porCuota = {}, porEstado = {};
registros.forEach((r) => {
  porCuota[r.clave ?? "??"] = (porCuota[r.clave ?? "??"] || 0) + 1;
  porEstado[r.estado] = (porEstado[r.estado] || 0) + 1;
});
console.log("Por cuota:", porCuota);
console.log("Por estado:", porEstado);
const sinClave = registros.filter((r) => !r.clave);
if (sinClave.length) {
  console.log(`\n⚠️ ${sinClave.length} sin cuota reconocida (importe €):`,
    [...new Set(sinClave.map((r) => (r.importe / 100).toFixed(2)))]);
}
console.log("\nEjemplos (primeros 5):");
registros.slice(0, 5).forEach((r) =>
  console.log(`  · ${r.nombre} ${r.apellidos} — ${r.email ?? "sin email"} — ${r.clave ?? "??"} — ${r.estado} (${r.statusStripe})`),
);

if (DRY) {
  console.log("\n(Prueba en seco: no se ha escrito nada en la base de datos.)");
  process.exit(0);
}

// --- Importación real ---
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { data: tipos } = await db.from("tipos_abono").select("id, clave");
const idPorClave = Object.fromEntries((tipos ?? []).map((t) => [t.clave, t.id]));

let creados = 0;
for (const r of registros) {
  const { error } = await db.from("socios").upsert(
    {
      nombre: r.nombre,
      apellidos: r.apellidos,
      email: r.email,
      telefono: r.telefono,
      tipo_abono_id: r.clave ? idPorClave[r.clave] : null,
      estado: r.estado,
      stripe_customer_id: r.stripe_customer_id,
      stripe_subscription_id: r.stripe_subscription_id,
      metodo_pago: "stripe",
    },
    { onConflict: "stripe_customer_id" },
  );
  if (error) console.warn(`  ⚠️ ${r.email}: ${error.message}`);
  else creados++;
}
console.log(`\n✅ Importados/actualizados: ${creados} socios.`);
