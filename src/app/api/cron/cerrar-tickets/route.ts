import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Tarea programada (Vercel Cron): cierra automáticamente los tickets del buzón
// que llevan más de 7 días SIN actividad (sin respuesta nueva ni mensaje
// entrante). "Actividad" = el último mensaje del hilo; si el más reciente es de
// hace más de 7 días y el ticket sigue abierto, pasa a estado "cerrado".
// No toca los que ya están cerrados ni los de la papelera.
//
// Seguridad: solo se ejecuta con el secreto CRON_SECRET (cabecera Authorization).
export const runtime = "nodejs";

const DIAS = 7;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = createAdminClient();
  const limite = new Date(Date.now() - DIAS * 24 * 60 * 60 * 1000);

  // Tickets abiertos (no cerrados, no en papelera).
  const { data: abiertos, error: errT } = await db
    .from("tickets")
    .select("id, created_at")
    .neq("estado", "cerrado")
    .is("eliminado_en", null);
  if (errT) return NextResponse.json({ error: errT.message }, { status: 500 });
  if (!abiertos || abiertos.length === 0) return NextResponse.json({ cerrados: 0 });

  const ids = abiertos.map((t) => t.id);

  // Último mensaje de cada uno de esos tickets (define la última actividad).
  const { data: mensajes, error: errM } = await db
    .from("ticket_mensajes")
    .select("ticket_id, created_at")
    .in("ticket_id", ids);
  if (errM) return NextResponse.json({ error: errM.message }, { status: 500 });

  const ultimaActividad = new Map<string, number>();
  for (const t of abiertos) ultimaActividad.set(t.id, new Date(t.created_at).getTime());
  for (const m of mensajes ?? []) {
    const t = new Date(m.created_at).getTime();
    if (t > (ultimaActividad.get(m.ticket_id) ?? 0)) ultimaActividad.set(m.ticket_id, t);
  }

  const aCerrar = abiertos
    .filter((t) => (ultimaActividad.get(t.id) ?? 0) < limite.getTime())
    .map((t) => t.id);

  if (aCerrar.length === 0) return NextResponse.json({ cerrados: 0 });

  const { error: errU } = await db
    .from("tickets")
    .update({ estado: "cerrado" })
    .in("id", aCerrar);
  if (errU) return NextResponse.json({ error: errU.message }, { status: 500 });

  return NextResponse.json({ cerrados: aCerrar.length });
}
