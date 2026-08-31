import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Deshace un registro de entrada recién creado (el verificador se ha
// equivocado de nº de socio, pulsación doble, etc.). Por seguridad solo se
// puede cancelar dentro de los 15 minutos posteriores al registro — pasado
// ese margen, ya no es "corregir un error al momento" sino tocar el
// histórico, y eso se hace desde la ficha del socio si hiciera falta.
//
// Sirve tanto para entradas de socios como de invitados (viven en tablas
// distintas, "entradas" y "entradas_invitado"): se prueba primero una y
// luego la otra, según en cuál exista ese id.
const MARGEN_MIN = 15;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let entradaId = "";
  try {
    entradaId = String((await request.json()).entradaId ?? "");
  } catch {
    /* sin cuerpo */
  }
  if (!entradaId) return NextResponse.json({ error: "Falta el id de la entrada" }, { status: 400 });

  const admin = createAdminClient();

  const [{ data: entrada }, { data: entradaInvitado }] = await Promise.all([
    admin.from("entradas").select("id, creado_en").eq("id", entradaId).maybeSingle(),
    admin.from("entradas_invitado").select("id, creado_en").eq("id", entradaId).maybeSingle(),
  ]);
  const fila = entrada ?? entradaInvitado;
  if (!fila) return NextResponse.json({ error: "Esa entrada ya no existe" }, { status: 404 });

  const antiguedadMin = (Date.now() - new Date(fila.creado_en).getTime()) / 60000;
  if (antiguedadMin > MARGEN_MIN) {
    return NextResponse.json(
      { error: `Ya han pasado más de ${MARGEN_MIN} minutos; no se puede deshacer desde aquí.` },
      { status: 409 },
    );
  }

  await admin.from(entrada ? "entradas" : "entradas_invitado").delete().eq("id", entradaId);
  return NextResponse.json({ ok: true });
}
