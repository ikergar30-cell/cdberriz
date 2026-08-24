import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Login SIN contraseña, solo para el rol "verificador" (el usuario de la
// entrada, que solo necesita abrir "Verificar carné"). Con el email nos
// basta: comprobamos que existe un empleado con ese email y rol
// "verificador", generamos un enlace mágico con la Admin API y lo
// verificamos en el mismo momento (sin enviar ningún correo), lo que crea
// la sesión directamente. Cualquier otro rol sigue necesitando contraseña
// en /admin/login.
export async function POST(request: NextRequest) {
  let email = "";
  try {
    email = String((await request.json()).email ?? "").trim().toLowerCase();
  } catch {
    /* sin cuerpo */
  }
  if (!email) return NextResponse.json({ error: "Falta el email" }, { status: 400 });

  const admin = createAdminClient();
  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol")
    .ilike("email", email)
    .maybeSingle();

  if (!perfil || perfil.rol !== "verificador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const hashedToken = link?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }

  const supabase = createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: hashedToken,
    type: "magiclink",
  });
  if (verifyError) {
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
