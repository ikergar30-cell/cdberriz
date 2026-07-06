// Rellena el enlace a la factura de Stripe en los pagos ya registrados
// ANTES de que el webhook empezara a guardarlos (stripe_hosted_invoice_url).
//
//   node --env-file=.env.local scripts/backfill-facturas-pagos.mjs --dry   (prueba, no escribe)
//   node --env-file=.env.local scripts/backfill-facturas-pagos.mjs         (rellena de verdad)
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");

const keyLive = process.env.STRIPE_LIVE_READ_KEY;
if (!keyLive?.startsWith("rk_live_") && !keyLive?.startsWith("sk_live_")) {
  console.error("❌ STRIPE_LIVE_READ_KEY debe ser una clave LIVE (rk_live_… o sk_live_…).");
  process.exit(1);
}
const stripe = new Stripe(keyLive);

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: pagos, error } = await db
  .from("pagos")
  .select("id, stripe_invoice_id")
  .not("stripe_invoice_id", "is", null)
  .is("stripe_hosted_invoice_url", null);

if (error) {
  console.error("❌ Error leyendo pagos:", error.message);
  process.exit(1);
}

console.log(`Encontrados ${pagos.length} pagos sin enlace de factura.`);

let actualizados = 0;
for (const pago of pagos) {
  const inv = await stripe.invoices.retrieve(pago.stripe_invoice_id).catch(() => null);
  if (!inv) {
    console.warn(`  ⚠️  Factura ${pago.stripe_invoice_id} no encontrada en Stripe, se omite.`);
    continue;
  }

  console.log(`  · ${pago.stripe_invoice_id} → ${inv.hosted_invoice_url ?? "(sin URL)"}`);
  if (!DRY) {
    await db
      .from("pagos")
      .update({
        stripe_hosted_invoice_url: inv.hosted_invoice_url ?? null,
        stripe_invoice_pdf: inv.invoice_pdf ?? null,
      })
      .eq("id", pago.id);
  }
  actualizados++;
}

console.log(
  DRY
    ? `\n(Prueba) Se actualizarían ${actualizados} pagos.`
    : `\n✅ Actualizados ${actualizados} pagos.`,
);
