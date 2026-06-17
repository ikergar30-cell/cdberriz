// Cliente de Supabase para Server Components, Route Handlers y Server Actions.
// Usa la anon key + las cookies de sesión del usuario. RLS sigue aplicando:
// solo verá datos de socios si el usuario logueado es un empleado.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: ignorar. El middleware refresca la sesión.
          }
        },
      },
    },
  );
}
