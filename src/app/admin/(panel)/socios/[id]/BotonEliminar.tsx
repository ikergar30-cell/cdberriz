"use client";

import { useState } from "react";
import { ERROR_GENERICO, type ActionResult } from "@/lib/actionResult";

export function BotonEliminar({ accion }: { accion: () => Promise<ActionResult> }) {
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function eliminar() {
    if (
      !confirm(
        "¿Eliminar este socio? Esta acción no se puede deshacer y su número de socio " +
          "quedará hueco para siempre (nunca se reasigna a otro socio).\n\n" +
          "Si el socio simplemente ha causado baja, usa \"Cancelar renovación\" en su ficha " +
          "en vez de eliminarlo: así conserva su historial y su número.",
      )
    ) {
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const resultado = await accion();
      if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
      }
      // Sin error: la acción ya ha hecho redirect().
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "digest" in e &&
        String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        return;
      }
      setError(ERROR_GENERICO);
      setCargando(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={eliminar}
        disabled={cargando}
        className="rounded-full border border-rojo px-4 py-2 text-sm font-semibold text-rojo transition hover:bg-rojo hover:text-white disabled:opacity-60"
      >
        {cargando ? "Eliminando…" : "Eliminar"}
      </button>
      {error && <p className="mt-2 max-w-xs text-sm font-semibold text-rojo">{error}</p>}
    </div>
  );
}
