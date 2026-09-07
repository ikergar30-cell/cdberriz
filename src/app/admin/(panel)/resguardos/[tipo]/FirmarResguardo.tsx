"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TipoPersonaPago } from "@/lib/supabase/types";
import { compartirODescargar, pdfBase64ABlob } from "@/lib/compartirArchivo";
import { PadFirma, type PadFirmaHandle } from "./PadFirma";

type Fila = {
  nombre: string;
  dni: string;
  importe: string;
  concepto: string;
  fecha: string;
};

type Resultado = {
  blob: Blob;
  filename: string;
  emailContabilidad: boolean;
  destinatario: string;
};

// Modal para firmar un resguardo con las dos partes (club y persona) en el
// móvil, enviarlo automáticamente a contabilidad y compartirlo (p. ej. por
// WhatsApp) con el árbitro/entrenador.
export function FirmarResguardo({
  tipo,
  fila,
  onClose,
}: {
  tipo: TipoPersonaPago;
  fila: Fila;
  onClose: () => void;
}) {
  const router = useRouter();
  const esArbitro = tipo === "arbitro";

  const padClub = useRef<PadFirmaHandle>(null);
  const padPersona = useRef<PadFirmaHandle>(null);
  const [clubOk, setClubOk] = useState(false);
  const [personaOk, setPersonaOk] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // Bloquea el scroll de la página de detrás mientras la modal está abierta.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  const importeNum = Number(fila.importe.replace(",", "."));
  const importeTxt = Number.isFinite(importeNum) ? `${importeNum.toFixed(2)} €` : fila.importe;

  async function firmarYEnviar() {
    setError(null);
    const firmaClub = padClub.current?.getDataUrl();
    const firmaPersona = padPersona.current?.getDataUrl();
    if (!firmaClub || !firmaPersona) {
      setError("Faltan las dos firmas.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/admin/resguardos/firmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, fila, firmaClub, firmaPersona }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.pdf) {
        throw new Error(json?.error || "No se pudo generar el resguardo firmado.");
      }
      setResultado({
        blob: pdfBase64ABlob(json.pdf),
        filename: json.filename,
        emailContabilidad: !!json.emailContabilidad,
        destinatario: json.destinatarioContabilidad,
      });
      router.refresh(); // refresca el histórico de resguardos
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el resguardo firmado.");
    } finally {
      setEnviando(false);
    }
  }

  const etiqueta = "mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-neutral-500";

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black/40 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        {resultado ? (
          // Pantalla de confirmación tras firmar.
          <div>
            <h2 className="font-display text-xl font-bold text-neutral-900">Resguardo firmado</h2>
            <div
              className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
                resultado.emailContabilidad
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {resultado.emailContabilidad
                ? `Enviado por email a ${resultado.destinatario} con el PDF firmado adjunto.`
                : `No se pudo enviar el email a ${resultado.destinatario}. El apunte está guardado y puedes compartir el PDF abajo y reenviarlo a mano.`}
            </div>
            <p className="mt-4 text-sm text-neutral-600">
              Comparte ahora el PDF firmado con {esArbitro ? "el árbitro" : "el entrenador"}:
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => compartirODescargar(resultado.blob, resultado.filename)}
                className="rounded-full bg-azul px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700"
              >
                Compartir / WhatsApp
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-600 transition hover:border-neutral-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-neutral-900">Firmar resguardo</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg px-2 py-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            {/* Resumen de lo que se firma */}
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase text-neutral-400">Nombre</dt>
                <dd className="font-semibold text-neutral-900">{fila.nombre || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">DNI</dt>
                <dd className="text-neutral-800">{fila.dni || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">Importe</dt>
                <dd className="font-semibold text-neutral-900">{importeTxt}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">
                  {esArbitro ? "Partido" : "Mes"}
                </dt>
                <dd className="text-neutral-800">{fila.concepto || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">Fecha</dt>
                <dd className="text-neutral-800">{fila.fecha || "—"}</dd>
              </div>
            </dl>

            {/* Firma del club */}
            <div className="mt-5">
              <div className={etiqueta}>
                <span>Firma del club (quien paga)</span>
                <button
                  type="button"
                  onClick={() => padClub.current?.limpiar()}
                  className="text-azul underline"
                >
                  Borrar
                </button>
              </div>
              <PadFirma ref={padClub} onCambio={setClubOk} />
            </div>

            {/* Firma de la persona */}
            <div className="mt-4">
              <div className={etiqueta}>
                <span>Firma {esArbitro ? "del árbitro" : "del entrenador"}</span>
                <button
                  type="button"
                  onClick={() => padPersona.current?.limpiar()}
                  className="text-azul underline"
                >
                  Borrar
                </button>
              </div>
              <PadFirma ref={padPersona} onCambio={setPersonaOk} />
            </div>

            {error && <p className="mt-4 text-sm font-semibold text-rojo">{error}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={firmarYEnviar}
                disabled={enviando || !clubOk || !personaOk}
                className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-50"
              >
                {enviando ? "Enviando…" : "Firmar y enviar a contabilidad"}
              </button>
              {(!clubOk || !personaOk) && (
                <span className="text-xs text-neutral-400">Firma en los dos recuadros para continuar.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
