import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/lib/supabase/types";
import { CATEGORIAS_TICKET, ESTADOS_TICKET, etiquetaCategoria, etiquetaEstado } from "@/config/tickets";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { estado?: string; categoria?: string; archivados?: string };
}) {
  const estado = searchParams.estado ?? "";
  const categoria = searchParams.categoria ?? "";
  const archivados = searchParams.archivados === "1";

  const supabase = createClient();
  let query = supabase
    .from("tickets")
    .select("id, nombre, email, asunto, categoria, estado, archivado, created_at, updated_at")
    .eq("archivado", archivados)
    .order("created_at", { ascending: false });
  if (estado) query = query.eq("estado", estado);
  if (categoria) query = query.eq("categoria", categoria);

  const { data } = await query;
  const tickets = (data as Ticket[]) ?? [];

  // Enlace que conserva los filtros vigentes al cambiar uno.
  const con = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base = { estado, categoria, archivados: archivados ? "1" : "", ...cambios };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const qs = p.toString();
    return `/admin/tickets${qs ? `?${qs}` : ""}`;
  };

  const chip = (activo: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-semibold transition ${
      activo ? "bg-azul text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
    }`;

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
        Buzón de contacto
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">
        Mensajes recibidos desde el formulario de la web. Ábrelos para responder, clasificar o archivar.
      </p>

      {/* Filtros por estado */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={con({ estado: "" })} className={chip(!estado)}>
          Todos
        </Link>
        {ESTADOS_TICKET.map((e) => (
          <Link key={e.valor} href={con({ estado: e.valor })} className={chip(estado === e.valor)}>
            {e.label}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-neutral-200" />
        <Link
          href={con({ archivados: archivados ? "" : "1", estado: "" })}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
            archivados ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          🗄 Archivados
        </Link>
      </div>

      {/* Filtro por categoría */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-400">Categoría:</span>
        <Link href={con({ categoria: "" })} className={chip(!categoria) + " !text-xs !py-1"}>
          Todas
        </Link>
        {CATEGORIAS_TICKET.map((c) => (
          <Link key={c.valor} href={con({ categoria: c.valor })} className={chip(categoria === c.valor) + " !text-xs !py-1"}>
            {c.label}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <p className="mt-6 rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          No hay {archivados ? "tickets archivados" : "mensajes"} con esos criterios.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Remitente</th>
                <th className="px-4 py-3">Asunto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tickets.map((t) => {
                const est = etiquetaEstado(t.estado);
                return (
                  <tr key={t.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${t.id}`} className="font-semibold text-azul-700 hover:underline">
                        {t.nombre}
                      </Link>
                      <p className="text-xs text-neutral-400">{t.email}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{t.asunto ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{etiquetaCategoria(t.categoria)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${est.badge}`}>
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatearFecha(t.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm text-neutral-400">{tickets.length} ticket(s)</p>
    </div>
  );
}
