// Crea en Stripe los productos y precios de las cuotas (suscripción anual) y
// guarda el stripe_price_id en la tabla tipos_abono de Supabase.
// Idempotente: usa metadata.clave para reutilizar productos ya creados.
//
// Uso: node --env-file=.env.local scripts/stripe-setup.mjs
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  console.error("⚠️ La clave no es de TEST (sk_test_). Aborto por seguridad.");
  process.exit(1);
}

const { data: cuotas, error } = await db
  .from("tipos_abono")
  .select("*")
  .order("orden");
if (error) {
  console.error("❌ Supabase:", error.message);
  process.exit(1);
}

for (const c of cuotas) {
  // ¿Ya existe un producto con esta clave? (evita duplicados al re-ejecutar)
  const existentes = await stripe.products.search({
    query: `metadata['clave']:'${c.clave}'`,
  });
  let producto = existentes.data[0];
  if (!producto) {
    producto = await stripe.products.create({
      name: `Cuota de socio · ${c.nombre}`,
      metadata: { clave: c.clave },
    });
  }

  // ¿Tiene ya un precio recurrente anual con el importe correcto?
  const precios = await stripe.prices.list({ product: producto.id, active: true });
  let precio = precios.data.find(
    (p) =>
      p.recurring?.interval === "year" &&
      p.unit_amount === c.precio_cents &&
      p.currency === "eur",
  );
  if (!precio) {
    precio = await stripe.prices.create({
      product: producto.id,
      currency: "eur",
      unit_amount: c.precio_cents,
      recurring: { interval: "year" },
      metadata: { clave: c.clave },
    });
  }

  // Guarda el price id en Supabase.
  await db.from("tipos_abono").update({ stripe_price_id: precio.id }).eq("id", c.id);

  console.log(`✓ ${c.nombre.padEnd(22)} ${(c.precio_cents / 100).toFixed(2)} €/año → ${precio.id}`);
}

console.log("\n✅ Cuotas creadas en Stripe (modo prueba) y enlazadas en Supabase.");
