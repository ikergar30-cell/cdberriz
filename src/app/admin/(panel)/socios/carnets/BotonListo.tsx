"use client";

import { useState } from "react";
import { marcarCarnetListo } from "./actions";

export function BotonListo({ id }: { id: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function marcar() {
    if (!confirm("¿Marcar este carné como listo para recoger? Se enviará un email al socio.")) return;
    setError(null);
    setCargando(true);
    try {
      await marcarCarnetListo(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={marcar}
        disabled={cargando}
        className="rounded-full bg-azul px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
      >
        {cargando ? "…" : "Marcar como listo"}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-rojo">{error}</p>}
    </div>
  );
}
