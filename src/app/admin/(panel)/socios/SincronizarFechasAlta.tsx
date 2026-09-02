"use client";

import { useState, useTransition } from "react";
import { sincronizarFechasAlta } from "./actions";

export function SincronizarFechasAlta() {
  const [pendiente, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  function ejecutar() {
    setResultado(null);
    startTransition(async () => {
      const r = await sincronizarFechasAlta();
      if ("error" in r) {
        setResultado(`Error: ${r.error}`);
      } else {
        setResultado(
          `Hecho: ${r.actualizadas} fecha(s) de alta rellenadas.` +
            (r.errores.length ? ` ${r.errores.length} con error (revisa la consola del servidor).` : ""),
        );
        if (r.errores.length) console.error("Errores al rellenar fechas de alta:", r.errores);
      }
    });
  }

  if (resultado) {
    return <p className="text-sm font-semibold text-neutral-700">{resultado}</p>;
  }

  return (
    <button
      onClick={ejecutar}
      disabled={pendiente}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-azul-200 hover:bg-azul-50/50 hover:text-azul disabled:opacity-60"
    >
      {pendiente ? "…" : "Rellenar fechas de alta"}
    </button>
  );
}
