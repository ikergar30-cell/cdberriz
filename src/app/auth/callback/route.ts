import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback de autenticación de Supabase. Maneja dos flujos:
// 1. token_hash + type=recovery  → email de recuperación de contraseña de empleado
// 2. token_hash + type=magiclink → enlace mágico de acceso al portal de socios
//
// OJO: el enlace mágico de socios se genera a mano con token_hash (ver
// iniciarSesionPortal en [locale]/cuenta/actions.ts), NO con el flujo PKCE
// (?code=...) de signInWithOtp. PKCE guarda un "verificador" en el
// navegador donde se PIDE el enlace, así que si el socio lo pide desde el
// ordenador y lo abre en el email del móvil (muy habitual), el intercambio
// falla en silencio y esta ruta acababa mandando a la home sin explicar
// nada. token_hash no tiene ese problema: no depende de en qué dispositivo
// se abra.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  const supabase = createClient();

  // Flujo de recuperación de contraseña (email "Reset password" de Supabase)
  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (!error) {
      // Redirigir al formulario de nueva contraseña del panel de empleados
      return NextResponse.redirect(`${origin}/admin/reset-password`);
    }
  }

  // Enlace mágico de acceso al portal de socios.
  if (tokenHash && type === "magiclink") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
