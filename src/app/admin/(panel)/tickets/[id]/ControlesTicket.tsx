"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarEstadoTicket, cambiarCategoriaTicket, archivarTicket } from "../actions";
import { CATEGORIAS_TICKET, ESTADOS_TICKET } from "@/config/tickets";
import { ERROR_GENERICO } from "@/lib/actionResult";
import type { EstadoTicket } from "@/lib/supabase/types";

export function ControlesTicket({
  ticketId,
  estado,
  categoria,
  archivado,
}: {
  ticketId: string;
  estado: EstadoTicket;
  categoria: string;
  archivado: boolean;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function ejecutar(accion: () => Promise<{ error: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      try {
        const r = await accion();
        if (r?.error) setError(r.error);
        else router.refresh();
      } catch {
        setError(ERROR_GENERICO);
      }
    });
  }

  const select =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/20 disabled:opacity-60";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Gestión
      </h2>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">Estado</label>
          <select
            value={estado}
            disabled={pendiente}
            onChange={(e) => ejecutar(() => cambiarEstadoTicket(ticketId, e.target.value as EstadoTicket))}
            className={select}
          >
            {ESTADOS_TICKET.map((e) => (
              <option key={e.valor} value={e.valor}>{e.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-neutral-400">Categoría</label>
          <select
            value={categoria}
            disabled={pendiente}
            onChange={(e) => ejecutar(() => cambiarCategoriaTicket(ticketId, e.target.value))}
            className={select}
          >
            {CATEGORIAS_TICKET.map((c) => (
              <option key={c.valor} value={c.valor}>{c.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => ejecutar(() => archivarTicket(ticketId, !archivado))}
          disabled={pendiente}
          className="w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-500 hover:text-neutral-900 disabled:opacity-60"
        >
          {archivado ? "Desarchivar" : "Archivar"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-rojo">{error}</p>}
    </div>
  );
}
