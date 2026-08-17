"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cambiarEstadoTicket,
  cambiarCategoriaTicket,
  archivarTicket,
  eliminarTicket,
  restaurarTicket,
  eliminarTicketDefinitivo,
} from "../actions";
import { CATEGORIAS_TICKET, ESTADOS_TICKET } from "@/config/tickets";
import { ERROR_GENERICO } from "@/lib/actionResult";
import type { EstadoTicket } from "@/lib/supabase/types";

const TEXTO_CONFIRMACION = "webcdberriz@gmail.com";

export function ControlesTicket({
  ticketId,
  estado,
  categoria,
  archivado,
  eliminadoEn,
}: {
  ticketId: string;
  estado: EstadoTicket;
  categoria: string;
  archivado: boolean;
  eliminadoEn: string | null;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [confirmandoDefinitivo, setConfirmandoDefinitivo] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");

  function ejecutar(accion: () => Promise<{ error: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      try {
        const r = await accion();
        if (r?.error) setError(r.error);
        else router.refresh();
      } catch (e) {
        // Algunas acciones (eliminar, eliminar definitivo) redirigen al
        // terminar: Next.js señaliza eso lanzando una excepción interna,
        // no es un fallo real.
        if (
          e &&
          typeof e === "object" &&
          "digest" in e &&
          String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
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

        {!eliminadoEn && (
          <button
            onClick={() => ejecutar(() => archivarTicket(ticketId, !archivado))}
            disabled={pendiente}
            className="w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-500 hover:text-neutral-900 disabled:opacity-60"
          >
            {archivado ? "Desarchivar" : "Archivar"}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-rojo">{error}</p>}

      {/* ── Papelera ── */}
      <div className="mt-5 border-t border-neutral-200 pt-4">
        {eliminadoEn ? (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              Este ticket está en la papelera desde el{" "}
              {new Date(eliminadoEn).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}.
            </p>
            <button
              onClick={() => ejecutar(() => restaurarTicket(ticketId))}
              disabled={pendiente}
              className="w-full rounded-full border border-azul px-4 py-2 text-sm font-semibold text-azul transition hover:bg-azul hover:text-white disabled:opacity-60"
            >
              Restaurar
            </button>

            {!confirmandoDefinitivo ? (
              <button
                onClick={() => setConfirmandoDefinitivo(true)}
                disabled={pendiente}
                className="w-full rounded-full border border-rojo/40 px-4 py-2 text-sm font-semibold text-rojo transition hover:bg-rojo-50 disabled:opacity-60"
              >
                Eliminar definitivamente
              </button>
            ) : (
              <div className="rounded-xl border border-rojo/30 bg-rojo-50 p-4">
                <p className="text-sm font-semibold text-rojo">
                  Esto borra el ticket y toda la conversación para siempre. No se puede deshacer.
                </p>
                <p className="mt-2 text-xs text-neutral-600">
                  Escribe <strong>{TEXTO_CONFIRMACION}</strong> para confirmar:
                </p>
                <input
                  value={textoConfirmacion}
                  onChange={(e) => setTextoConfirmacion(e.target.value)}
                  placeholder={TEXTO_CONFIRMACION}
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-rojo focus:ring-2 focus:ring-rojo/20"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setConfirmandoDefinitivo(false);
                      setTextoConfirmacion("");
                    }}
                    disabled={pendiente}
                    className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => ejecutar(() => eliminarTicketDefinitivo(ticketId, textoConfirmacion))}
                    disabled={pendiente || textoConfirmacion.trim() !== TEXTO_CONFIRMACION}
                    className="flex-1 rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-40"
                  >
                    Borrar para siempre
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : !confirmandoBorrado ? (
          <button
            onClick={() => setConfirmandoBorrado(true)}
            disabled={pendiente}
            className="w-full rounded-full border border-rojo/40 px-4 py-2 text-sm font-semibold text-rojo transition hover:bg-rojo-50 disabled:opacity-60"
          >
            Eliminar
          </button>
        ) : (
          <div className="rounded-xl border border-rojo/30 bg-rojo-50 p-4">
            <p className="text-sm font-semibold text-rojo">¿Seguro que quieres eliminar este ticket?</p>
            <p className="mt-1 text-xs text-neutral-600">
              Pasará a la papelera. Podrás restaurarlo o borrarlo definitivamente desde ahí.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setConfirmandoBorrado(false)}
                disabled={pendiente}
                className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => ejecutar(() => eliminarTicket(ticketId))}
                disabled={pendiente}
                className="flex-1 rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
