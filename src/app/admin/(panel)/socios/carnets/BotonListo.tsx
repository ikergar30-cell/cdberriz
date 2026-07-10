"use client";

import { useState } from "react";
import { marcarCarnetListo } from "./actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

// Mensaje tipo: se rellena solo al abrir el formulario para agilizar el caso
// habitual (mismo horario/lugar de siempre). El empleado lo puede editar
// antes de enviar, p. ej. para poner una fecha concreta.
const MENSAJE_TIPO =
  "Ya puedes pasar a recogerlo por Berrizburu Futbol Zelaia, en horario de entrenamientos.";

export function BotonListo({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(MENSAJE_TIPO);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setError(null);
    setCargando(true);
    try {
      const resultado = await marcarCarnetListo(id, mensaje);
      if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
      }
    } catch {
      setError(ERROR_GENERICO);
      setCargando(false);
    }
  }

  if (!abierto) {
    return (
      <div className="text-right">
        <button
          onClick={() => setAbierto(true)}
          className="rounded-full bg-azul px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-azul-700"
        >
          Marcar como listo
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 text-left">
      <label className="block text-xs font-semibold text-neutral-600">
        Fecha de recogida o mensaje para el socio
      </label>
      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Ej: Ya puedes recogerlo en Berrizburu a partir del 15 de septiembre, en horario de tarde."
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/20"
      />
      <p className="mt-1 text-xs text-neutral-400">
        Este texto se enviará al socio por email y se verá en su portal.
      </p>
      {error && <p className="mt-1 text-xs font-semibold text-rojo">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={confirmar}
          disabled={cargando}
          className="rounded-full bg-azul px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
        >
          {cargando ? "Enviando…" : "Marcar listo y avisar"}
        </button>
        <button
          onClick={() => setAbierto(false)}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
