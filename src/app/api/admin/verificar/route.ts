import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarDni } from "@/lib/dni";

// Verifica un carné (por QR o, si el socio no lo tiene a mano, buscándolo por
// nº de socio / email / DNI) Y registra la entrada del día (check-in). Solo
// empleados. Si el socio ya entró hace poco, NO bloquea: avisa con la hora
// para que el portero decida (reentrada legítima vs carné compartido).
const VENTANA_MIN = 40;

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

  let body: { token?: string; numero_socio?: string; email?: string; dni?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* sin cuerpo */
  }

  const token = String(body.token ?? "").trim();
  const numeroSocio = String(body.numero_socio ?? "").trim();
  const email = String(body.email ?? "").trim();
  const dni = String(body.dni ?? "").trim();

  const admin = createAdminClient();
  const columnas = "id, nombre, apellidos, numero_socio, estado, foto_url, tipos_abono(nombre)";

  let socio;
  if (token) {
    ({ data: socio } = await admin.from("socios").select(columnas).eq("carnet_token", token).maybeSingle());
  } else if (numeroSocio || email || dni) {
    // Búsqueda manual: se combinan (AND) los campos que el verificador tenga
    // a mano, para confirmar que es realmente esa persona. Si no encuentra
    // exactamente uno, no se da acceso (ambigüedad = no válido).
    let query = admin.from("socios").select(columnas);
    if (numeroSocio) {
      const n = Number(numeroSocio);
      if (!Number.isInteger(n)) return NextResponse.json({ encontrado: false });
      query = query.eq("numero_socio", n);
    }
    if (email) query = query.ilike("email", email);
    if (dni) query = query.eq("dni", normalizarDni(dni));

    const { data: coincidencias } = await query.limit(2);
    socio = coincidencias?.length === 1 ? coincidencias[0] : null;
  } else {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

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

  // ¿Ha entrado en los últimos VENTANA_MIN minutos? Esta ventana se reinicia,
  // de modo que si hay otro partido más tarde el mismo día, el socio puede
  // volver a entrar.
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
    // Entró hace menos de VENTANA_MIN min: avisamos con la hora, NO bloqueamos (decide el portero).
    const hora = new Date(previa.creado_en).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return NextResponse.json({ ...base, yaEntro: true, horaEntrada: hora });
  }

  // Entrada nueva (o pasada la ventana): la registramos.
  await admin.from("entradas").insert({ socio_id: socio.id, empleado_id: user.id });
  return NextResponse.json({ ...base, yaEntro: false, horaEntrada: null });
}
