"use client";

import { useState } from "react";
import { eliminarJugador } from "./actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

export function BotonEliminarJugador({ id, nombre }: { id: string; nombre: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    if (!confirm(`¿Eliminar a "${nombre}" de la lista de jugadores/as? No se toca a sus padres/madres, solo este enlace.`)) {
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const resultado = await eliminarJugador(id);
      if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
      }
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
        return;
      }
      setError(ERROR_GENERICO);
      setCargando(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={confirmar}
        disabled={cargando}
        className="text-sm font-semibold text-rojo hover:underline disabled:opacity-60"
      >
        {cargando ? "…" : "Eliminar"}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-rojo">{error}</p>}
    </div>
  );
}
