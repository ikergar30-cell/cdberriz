"use client";

import { useState } from "react";
import { responderTicket } from "../actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

export function Responder({ ticketId, email }: { ticketId: string; email: string }) {
  const [cuerpo, setCuerpo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setError(null);
    setCargando(true);
    try {
      const resultado = await responderTicket(ticketId, cuerpo);
      if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
        return;
      }
      setCuerpo("");
      setCargando(false);
    } catch {
      setError(ERROR_GENERICO);
      setCargando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <label className="block text-sm font-semibold text-neutral-700">
        Responder a {email}
      </label>
      <textarea
        value={cuerpo}
        onChange={(e) => setCuerpo(e.target.value)}
        rows={5}
        placeholder="Escribe tu respuesta…"
        className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20"
      />
      <p className="mt-1 text-xs text-neutral-400">
        Se enviará por email desde no-responder@cdberriz.com. Las respuestas del socio llegarán a coordinación.
      </p>
      {error && <p className="mt-2 text-sm font-semibold text-rojo">{error}</p>}
      <button
        onClick={enviar}
        disabled={cargando || !cuerpo.trim()}
        className="mt-3 rounded-full bg-rojo px-6 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-50"
      >
        {cargando ? "Enviando…" : "Enviar respuesta"}
      </button>
    </div>
  );
}
