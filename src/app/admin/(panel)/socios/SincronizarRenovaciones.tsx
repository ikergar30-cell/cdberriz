"use client";

import { useState, useTransition } from "react";
import { sincronizarRenovaciones } from "./actions";

export function SincronizarRenovaciones() {
  const [pendiente, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  function ejecutar() {
    setResultado(null);
    startTransition(async () => {
      const r = await sincronizarRenovaciones();
      if ("error" in r) {
        setResultado(`Error: ${r.error}`);
      } else {
        setResultado(
          `Hecho: ${r.actualizadas} reprogramadas, ${r.yaAlineadas} ya estaban bien, ${r.noActivas} sin suscripción activa.` +
            (r.errores.length ? ` ${r.errores.length} con error (revisa la consola del servidor).` : ""),
        );
        if (r.errores.length) console.error("Errores al sincronizar renovaciones:", r.errores);
      }
      setConfirmando(false);
    });
  }

  if (resultado) {
    return <p className="text-sm font-semibold text-neutral-700">{resultado}</p>;
  }

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
      >
        Sincronizar renovaciones
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
      <span>¿Mover TODAS las renovaciones de Stripe a la próxima fecha objetivo?</span>
      <button
        onClick={() => setConfirmando(false)}
        disabled={pendiente}
        className="font-semibold text-neutral-500 hover:text-neutral-800 disabled:opacity-60"
      >
        Cancelar
      </button>
      <button
        onClick={ejecutar}
        disabled={pendiente}
        className="rounded-full bg-amber-600 px-3 py-1 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
      >
        {pendiente ? "…" : "Sí, sincronizar"}
      </button>
    </div>
  );
}
