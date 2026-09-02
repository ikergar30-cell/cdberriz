import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketMensaje } from "@/lib/supabase/types";
import { etiquetaCategoria, etiquetaEstado } from "@/config/tickets";
import { Responder } from "./Responder";
import { ControlesTicket } from "./ControlesTicket";

function formatearFechaHora(fecha: string) {
  return new Date(fecha).toLocaleString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TicketPage({ params: { id } }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: ticket }, { data: mensajes }] = await Promise.all([
    supabase.from("tickets").select("*").eq("id", id).single(),
    supabase
      .from("ticket_mensajes")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket) notFound();

  const t = ticket as Ticket;
  const hilo = (mensajes as TicketMensaje[]) ?? [];
  const est = etiquetaEstado(t.estado);

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/tickets" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        ← Volver al buzón
      </Link>

      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[28px] font-extrabold uppercase leading-none tracking-tight text-azul-900 md:text-[32px]">
          {t.asunto || "Mensaje de contacto"}
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${est.badge}`}>{est.label}</span>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          {etiquetaCategoria(t.categoria)}
        </span>
        {t.archivado && (
          <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700">
            Archivado
          </span>
        )}
        {t.eliminado_en && (
          <span className="rounded-full bg-rojo-50 px-3 py-1 text-xs font-semibold text-rojo">
            En la papelera
          </span>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        {/* Conversación + respuesta */}
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            De <strong className="text-neutral-800">{t.nombre}</strong>{" "}
            (<a href={`mailto:${t.email}`} className="text-azul hover:underline">{t.email}</a>
            {t.telefono ? (
              <>
                {" · "}
                <a href={`tel:${t.telefono}`} className="text-azul hover:underline">{t.telefono}</a>
              </>
            ) : null}
            ) · {formatearFechaHora(t.created_at)}
          </p>

          <div className="space-y-3">
            {hilo.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl border p-4 ${
                  m.del_club
                    ? "border-azul-100 bg-azul-50/60 ml-6"
                    : "border-neutral-200 bg-white mr-6"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-600">
                    {m.del_club ? `C.D. Berriz · ${m.autor ?? "Club"}` : t.nombre}
                  </span>
                  <span className="text-xs text-neutral-400">{formatearFechaHora(m.created_at)}</span>
                </div>
                <p className="whitespace-pre-line text-sm text-neutral-800">{m.cuerpo}</p>
              </div>
            ))}
          </div>

          <Responder ticketId={t.id} email={t.email} />
        </div>

        {/* Panel lateral de gestión */}
        <ControlesTicket
          ticketId={t.id}
          estado={t.estado}
          categoria={t.categoria}
          archivado={t.archivado}
          eliminadoEn={t.eliminado_en}
        />
      </div>
    </div>
  );
}
