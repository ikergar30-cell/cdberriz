import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Login de la cuenta de taquilla (rol "verificador"), que solo necesita abrir
// "Verificar carné". No usa contraseña personal, pero SÍ un PIN de taquilla:
// sin él, cualquiera que supiera el email —que está publicado en la propia
// web— obtendría una sesión de empleado.
//
// El PIN CAMBIA CADA MES automáticamente: es una palabra secreta del club
// (variable de entorno VERIFICADOR_PIN, p. ej. "cdb") seguida del año y el mes,
// p. ej. "cdb202609" en septiembre de 2026 y "cdb202610" en octubre. Así rota
// solo cada mes sin tener que tocar nada, y sigue siendo seguro porque el mes
// por sí solo no basta (hay que saber también la palabra secreta).
//
// Todas las respuestas de fallo son el mismo 401 genérico, para no revelar si
// un email concreto existe o no (antes, tres respuestas distintas permitían
// deducir el email carácter a carácter).

// "AAAAMM" del mes en curso en hora de Berriz (Europe/Madrid), para que el
// cambio de mes caiga a medianoche local y no desfasado por la zona horaria.
function mesActualMadrid(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const anio = partes.find((p) => p.type === "year")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";
  return `${anio}${mes}`;
}

// Comparación en tiempo constante, robusta ante longitudes distintas.
function pinCorrecto(dado: string, esperado: string): boolean {
  const a = Buffer.from(dado);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  let email = "";
  let pin = "";
  try {
    const cuerpo = await request.json();
    email = String(cuerpo.email ?? "").trim().toLowerCase();
    pin = String(cuerpo.pin ?? "");
  } catch {
    /* sin cuerpo */
  }

  if (!email || !pin) {
    return NextResponse.json({ error: "Faltan el email o el PIN" }, { status: 400 });
  }

  const secreto = process.env.VERIFICADOR_PIN;
  if (!secreto) {
    // No configurado: fallar cerrado, pero con un mensaje que el personal
    // entienda (es un problema de configuración, no un fallo suyo).
    return NextResponse.json(
      { error: "El acceso de taquilla no está configurado. Avisa al administrador." },
      { status: 503 },
    );
  }

  // El código válido este mes: palabra secreta + AAAAMM. Se comparan en
  // minúsculas para que dé igual cómo se teclee la palabra.
  const esperado = `${secreto}${mesActualMadrid()}`.toLowerCase();

  // PIN primero: así, sin el PIN, la respuesta es idéntica para cualquier email
  // y no se puede enumerar qué correos tienen acceso.
  if (!pinCorrecto(pin.trim().toLowerCase(), esperado)) {
    return NextResponse.json({ error: "Email o PIN incorrecto" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol")
    .eq("email", email) // coincidencia EXACTA, nunca por patrón (.ilike)
    .maybeSingle();

  if (!perfil || perfil.rol !== "verificador") {
    return NextResponse.json({ error: "Email o PIN incorrecto" }, { status: 401 });
  }

  // Con email + PIN correctos, se crea la sesión al momento (enlace mágico
  // generado y verificado en el servidor, sin enviar ningún correo).
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
