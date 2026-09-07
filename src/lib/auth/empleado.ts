import { createClient } from "@/lib/supabase/server";

// Comprueba que hay una sesión de EMPLEADO PLENO: admin o empleado, nunca el
// rol "verificador" (la cuenta de taquilla, que entra sin contraseña personal).
//
// Pensado para los route handlers de /api/admin/* que usan service_role y por
// tanto se saltan la RLS: sin esta comprobación, una sesión de verificador
// podría leer o escribir datos que la RLS le negaría. Devuelve el userId y el
// rol si está autorizado, o null si no (el llamante responde 401/403).
export async function empleadoPleno(): Promise<{ userId: string; rol: string } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil || perfil.rol === "verificador") return null;

  return { userId: user.id, rol: perfil.rol };
}
