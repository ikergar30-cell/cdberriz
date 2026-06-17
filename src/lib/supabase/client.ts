// Cliente de Supabase para componentes de navegador ("use client").
// Usa SOLO la anon key (pública). El acceso a datos lo controla RLS.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
