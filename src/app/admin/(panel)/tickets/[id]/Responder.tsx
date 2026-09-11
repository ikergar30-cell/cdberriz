"use client";

import { useState } from "react";
import { responderTicket } from "../actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

// Plantilla editable de la respuesta: saludo arriba y firma abajo, con hueco en
// medio para escribir. El empleado la ve entera y puede cambiar lo que quiera
// (incluida la firma) antes de enviar. Se envía y se guarda tal cual.
function plantillaRespuesta(nombre: string) {
  const primerNombre = (nombre || "").trim().split(/\s+/)[0] || "";
  const saludo = primerNombre ? `Hola ${primerNombre}:` : "Hola:";
  return `${saludo}\n\n\nUn saludo,\nC.D. Berriz ❤️💙`;
}

export function Responder({
  ticketId,
  email,
  nombre,
}: {
  ticketId: string;
  email: string;
  nombre: string;
}) {
  const [cuerpo, setCuerpo] = useState(() => plantillaRespuesta(nombre));
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
      setCuerpo(plantillaRespuesta(nombre));
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
        rows={9}
        placeholder="Escribe tu respuesta…"
        className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20"
      />
      <p className="mt-1 text-xs text-neutral-400">
        Se envía desde no-responder@cdberriz.com, con copia a coordinación y a la web. La firma se puede editar aquí mismo.
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
