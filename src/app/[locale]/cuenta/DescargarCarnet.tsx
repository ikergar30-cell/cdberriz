"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { compartirODescargar } from "@/lib/compartirArchivo";

// Envuelve el carné y añade un botón para descargarlo como imagen (PNG). Captura
// el propio carné ya renderizado con html-to-image y lo entrega por la hoja de
// compartir del sistema: en el móvil ofrece "Guardar imagen" (galería) y en
// escritorio lo descarga. La captura se hace al pulsar (import dinámico), para
// no cargar la librería si no se usa.
export function DescargarCarnet({
  children,
  nombreArchivo,
}: {
  children: React.ReactNode;
  nombreArchivo: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const eu = locale === "eu";
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    if (!ref.current) return;
    setError(null);
    setCargando(true);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(ref.current, {
        pixelRatio: 3, // nítido para pantallas retina / impresión
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      if (!blob) throw new Error("sin imagen");
      await compartirODescargar(blob, nombreArchivo);
    } catch {
      setError(
        eu ? "Ezin izan da deskargatu. Saiatu berriro." : "No se pudo descargar. Inténtalo de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      {/* Lo que se captura: solo el carné */}
      <div ref={ref} className="w-fit">
        {children}
      </div>

      <button
        type="button"
        onClick={descargar}
        disabled={cargando}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-azul px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        {cargando ? (eu ? "Sortzen…" : "Generando…") : eu ? "Karneta deskargatu" : "Descargar carné"}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-rojo">{error}</p>}
    </div>
  );
}
