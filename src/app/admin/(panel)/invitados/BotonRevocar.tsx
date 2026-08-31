"use client";

import { useState } from "react";
import { revocarInvitado } from "./actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

export function BotonRevocar({ id, nombre }: { id: string; nombre: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    if (!confirm(`¿Anular la invitación de "${nombre}"? Dejará de servir aunque no haya caducado.`)) return;
    setError(null);
    setCargando(true);
    try {
      const resultado = await revocarInvitado(id);
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
        {cargando ? "…" : "Revocar"}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-rojo">{error}</p>}
    </div>
  );
}
