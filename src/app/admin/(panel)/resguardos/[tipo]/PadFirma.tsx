"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Panel de firma manuscrita sobre un canvas. Funciona con dedo (móvil) y ratón
// (escritorio). Devuelve la firma como PNG transparente (solo la tinta), listo
// para estamparlo sobre la línea del PDF.
export type PadFirmaHandle = {
  /** PNG en data URL, o null si no se ha firmado nada. */
  getDataUrl: () => string | null;
  limpiar: () => void;
};

export const PadFirma = forwardRef<PadFirmaHandle, { onCambio?: (dibujado: boolean) => void }>(
  function PadFirma({ onCambio }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dibujando = useRef(false);
    const dibujado = useRef(false);
    const ultimo = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Ajusta la resolución real del canvas al tamaño mostrado, con la
      // densidad de píxeles del dispositivo, para que la firma no salga borrosa.
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111111";
    }, []);

    function posicion(e: React.PointerEvent<HTMLCanvasElement>) {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
      e.preventDefault();
      dibujando.current = true;
      ultimo.current = posicion(e);
      // Capturar el puntero mantiene el trazo aunque el dedo se salga del
      // recuadro; si el navegador no lo permite, se ignora sin romper la firma.
      try {
        canvasRef.current?.setPointerCapture(e.pointerId);
      } catch {
        /* puntero no capturable: no pasa nada */
      }
    }

    function mover(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!dibujando.current) return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !ultimo.current) return;
      const p = posicion(e);
      ctx.beginPath();
      ctx.moveTo(ultimo.current.x, ultimo.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ultimo.current = p;
      if (!dibujado.current) {
        dibujado.current = true;
        onCambio?.(true);
      }
    }

    function terminar() {
      dibujando.current = false;
      ultimo.current = null;
    }

    useImperativeHandle(ref, () => ({
      getDataUrl: () => (dibujado.current ? canvasRef.current!.toDataURL("image/png") : null),
      limpiar: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        dibujado.current = false;
        onCambio?.(false);
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        // touch-none: sin esto, arrastrar el dedo haría scroll en vez de firmar.
        className="h-40 w-full cursor-crosshair touch-none rounded-lg border border-neutral-300 bg-white"
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerLeave={terminar}
      />
    );
  },
);
