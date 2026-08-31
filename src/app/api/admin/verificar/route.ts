import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarDni } from "@/lib/dni";

// Verifica un carné (por QR o, si el socio no lo tiene a mano, buscándolo por
// nº de socio / email / DNI) Y registra la entrada del día (check-in). Solo
// empleados. Si el socio ya entró hace poco, NO bloquea: avisa con la hora
// para que el portero decida (reentrada legítima vs carné compartido).
//
// El QR también puede ser una invitación temporal (tabla "invitados", ver
// /admin/invitados) en vez de un socio: se comprueba aparte porque vive en
// sus propias tablas (no se mezcla con las estadísticas de socios).
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
    // Ningún socio con ese token: puede ser una invitación temporal.
    if (!socio) return await verificarInvitado(admin, token, user.id);
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
    if (dni) {
      const dniNorm = normalizarDni(dni);
      // Si no ha escrito la letra (solo dígitos), buscamos por los dígitos:
      // la letra del DNI se calcula a partir del número, así que ya
      // identifica a la persona sin necesidad de teclearla.
      query = /^\d+$/.test(dniNorm) ? query.ilike("dni", `${dniNorm}%`) : query.eq("dni", dniNorm);
    }

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
    tipo: "socio" as const,
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

  // Entrada nueva (o pasada la ventana): la registramos. Devolvemos su id
  // para poder deshacerla desde la pantalla si el verificador se equivoca
  // (nº de socio erróneo, pulsación doble…) — ver /api/admin/verificar/cancelar.
  const { data: entrada } = await admin
    .from("entradas")
    .insert({ socio_id: socio.id, empleado_id: user.id })
    .select("id")
    .single();
  return NextResponse.json({ ...base, yaEntro: false, horaEntrada: null, entradaId: entrada?.id ?? null });
}

async function verificarInvitado(admin: ReturnType<typeof createAdminClient>, token: string, empleadoId: string) {
  const { data: invitado } = await admin
    .from("invitados")
    .select("id, nombre, motivo, expira_en, revocado_en, usos_maximos")
    .eq("token", token)
    .maybeSingle();

  if (!invitado) return NextResponse.json({ encontrado: false });

  const { count: usados } = await admin
    .from("entradas_invitado")
    .select("id", { count: "exact", head: true })
    .eq("invitado_id", invitado.id);

  const caducado = new Date(invitado.expira_en) < new Date();
  const agotado = (usados ?? 0) >= invitado.usos_maximos;
  const valido = !invitado.revocado_en && !caducado && !agotado;
  const estado = invitado.revocado_en ? "revocado" : caducado ? "caducado" : agotado ? "agotado" : "vigente";

  const base = {
    encontrado: true,
    tipo: "invitado" as const,
    valido,
    nombre: invitado.nombre,
    apellidos: "",
    numero_socio: null,
    estado,
    cuota: invitado.motivo,
    foto_url: null,
    expiraEn: invitado.expira_en,
  };

  if (!valido) {
    return NextResponse.json({ ...base, yaEntro: false, horaEntrada: null });
  }

  // Misma ventana de "ya había entrado" que los socios, para no contar dos
  // veces un doble escaneo seguido del mismo invitado.
  const VENTANA_INVITADO_MIN = 40;
  const desde = new Date(Date.now() - VENTANA_INVITADO_MIN * 60 * 1000).toISOString();
  const { data: previa } = await admin
    .from("entradas_invitado")
    .select("creado_en")
    .eq("invitado_id", invitado.id)
    .gte("creado_en", desde)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previa) {
    const hora = new Date(previa.creado_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return NextResponse.json({ ...base, yaEntro: true, horaEntrada: hora });
  }

  const { data: entrada } = await admin
    .from("entradas_invitado")
    .insert({ invitado_id: invitado.id, empleado_id: empleadoId })
    .select("id")
    .single();
  return NextResponse.json({ ...base, yaEntro: false, horaEntrada: null, entradaId: entrada?.id ?? null });
}
