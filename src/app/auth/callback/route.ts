import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback de autenticación de Supabase. Maneja dos flujos:
// 1. token_hash + type=recovery → email de recuperación de contraseña de empleado
// 2. code → enlace mágico de inicio de sesión (socios y empleados)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
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

  // Flujo de enlace mágico (socios o empleados)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
