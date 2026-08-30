"use client";

import { useState } from "react";
import { rechazarCarnetSinFoto } from "./actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

export function BotonRechazar({ id, nombre }: { id: string; nombre: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    if (!confirm(`¿Rechazar la solicitud de "${nombre}" por no tener foto subida? Se le avisará por email.`)) {
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const resultado = await rechazarCarnetSinFoto(id);
      if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
      }
    } catch {
      setError(ERROR_GENERICO);
      setCargando(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={confirmar}
        disabled={cargando}
        className="text-xs font-semibold text-rojo hover:underline disabled:opacity-60"
      >
        {cargando ? "…" : "Rechazar (sin foto)"}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-rojo">{error}</p>}
    </div>
  );
}
