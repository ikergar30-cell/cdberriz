// Cliente de Supabase con service_role — SOLO para el servidor (webhooks de Stripe).
// La service_role IGNORA RLS: tiene acceso total. NUNCA importar esto en código
// que llegue al navegador. Por eso no lleva el prefijo NEXT_PUBLIC_ y vive aparte.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
