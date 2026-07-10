import { readFile } from "fs/promises";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generarCarnetsPDF, nombreArchivoCarnet, type SocioCarnet } from "@/lib/carnet/pdf";

export const runtime = "nodejs";

// Genera el PDF de carnés físicos para imprenta. Sin parámetros: todos los
// pendientes de entregar (una tarjeta por página). Con ?id=<socio>: solo ese
// socio. Solo empleados autenticados.
export async function GET(request: NextRequest) {
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

  const id = request.nextUrl.searchParams.get("id");
  const admin = createAdminClient();

  const base = () =>
    admin.from("socios").select("nombre, apellidos, numero_socio, carnet_token").not("carnet_token", "is", null);

  // Con id: ese socio. Sin id: lote para imprenta (pedido y aún no entregado).
  const { data, error } = id
    ? await base().eq("id", id)
    : await base()
        .not("carnet_fisico_pedido_en", "is", null)
        .is("carnet_fisico_entregado_en", null)
        .order("numero_socio", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const socios = (data as SocioCarnet[] | null)?.filter((s) => s.carnet_token) ?? [];
  if (socios.length === 0) {
    return NextResponse.json({ error: "No hay carnés que generar." }, { status: 404 });
  }

  try {
    const escudo = new Uint8Array(await readFile(path.join(process.cwd(), "public", "escudo.png")));
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const pdf = await generarCarnetsPDF(socios, escudo, siteUrl);

    const nombre = socios.length === 1 ? nombreArchivoCarnet(socios[0]) : "carnes-fisicos-imprenta.pdf";

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombre}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }
}
