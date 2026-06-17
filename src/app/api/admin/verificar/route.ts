import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verifica un carné por su token Y registra la entrada del día (check-in).
// Solo empleados. Si el socio ya entró hoy, NO bloquea: avisa con la hora para
// que el portero decida (reentrada legítima vs carné compartido).
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

  let token = "";
  try {
    token = String((await request.json()).token ?? "");
  } catch {
    /* sin cuerpo */
  }
  if (!token) return NextResponse.json({ error: "Sin token" }, { status: 400 });

  const admin = createAdminClient();
  const { data: socio } = await admin
    .from("socios")
    .select("id, nombre, apellidos, numero_socio, estado, foto_url, tipos_abono(nombre)")
    .eq("carnet_token", token)
    .maybeSingle();

  if (!socio) return NextResponse.json({ encontrado: false });

  const tipo = (socio as unknown as { tipos_abono?: { nombre: string } | null }).tipos_abono;
  const valido = socio.estado === "activo";

  // Datos base de respuesta.
  const base = {
    encontrado: true,
    valido,
    nombre: socio.nombre,
    apellidos: socio.apellidos,
    numero_socio: socio.numero_socio,
    estado: socio.estado,
    cuota: tipo?.nombre ?? null,
    foto_url: socio.foto_url,
  };

  // Si no es válido, no registramos entrada.
  if (!valido) {
    return NextResponse.json({ ...base, yaEntro: false, horaEntrada: null });
  }

  // ¿Ha entrado en los últimos 45 minutos? Esta ventana se reinicia, de modo que
  // si hay otro partido más tarde el mismo día, el socio puede volver a entrar.
  const VENTANA_MIN = 45;
  const desde = new Date(Date.now() - VENTANA_MIN * 60 * 1000).toISOString();
  const { data: previa } = await admin
    .from("entradas")
    .select("creado_en")
    .eq("socio_id", socio.id)
    .gte("creado_en", desde)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previa) {
    // Entró hace menos de 45 min: avisamos con la hora, NO bloqueamos (decide el portero).
    const hora = new Date(previa.creado_en).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return NextResponse.json({ ...base, yaEntro: true, horaEntrada: hora });
  }

  // Entrada nueva (o pasados los 45 min): la registramos.
  await admin.from("entradas").insert({ socio_id: socio.id, empleado_id: user.id });
  return NextResponse.json({ ...base, yaEntro: false, horaEntrada: null });
}
