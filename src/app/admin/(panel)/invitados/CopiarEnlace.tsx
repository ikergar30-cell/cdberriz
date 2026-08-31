"use client";

import { useState } from "react";

export function CopiarEnlace({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* si el navegador bloquea el portapapeles, el enlace ya está visible para copiarlo a mano */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="w-full min-w-0 flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 outline-none"
      />
      <button
        type="button"
        onClick={copiar}
        className="shrink-0 rounded-full bg-azul px-3 py-2 text-xs font-semibold text-white transition hover:bg-azul-700"
      >
        {copiado ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
