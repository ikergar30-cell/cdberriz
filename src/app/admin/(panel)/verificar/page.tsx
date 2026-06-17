"use client";

import { useEffect, useRef, useState } from "react";

type Resultado =
  | { encontrado: false }
  | {
      encontrado: true;
      valido: boolean;
      yaEntro: boolean;
      horaEntrada: string | null;
      nombre: string;
      apellidos: string;
      numero_socio: number;
      estado: string;
      cuota: string | null;
      foto_url: string | null;
    };

export default function VerificarPage() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  async function iniciar() {
    setResultado(null);
    setError(null);
    setEscaneando(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("lector-qr");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (texto: string) => {
          // El QR contiene .../verificar/<token>; extraemos el token.
          const m = texto.match(/\/verificar\/([^/?#]+)/);
          const token = m ? m[1] : texto;
          await detener();
          await comprobar(token);
        },
        () => {},
      );
    } catch {
      setError("No se pudo abrir la cámara. Da permiso de cámara o usa la cámara del móvil sobre el QR.");
      setEscaneando(false);
    }
  }

  async function detener() {
    try {
      await scannerRef.current?.stop();
    } catch {}
    scannerRef.current = null;
    setEscaneando(false);
  }

  async function comprobar(token: string) {
    try {
      const res = await fetch("/api/admin/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResultado(await res.json());
    } catch {
      setError("Error al verificar.");
    }
  }

  // Al salir de la página, apagar la cámara.
  useEffect(() => () => void detener(), []);

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold uppercase text-neutral-900">
        Verificar carné
      </h1>

      {!escaneando && !resultado && (
        <button
          onClick={iniciar}
          className="rounded-full bg-rojo px-6 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600"
        >
          Abrir cámara y escanear
        </button>
      )}

      {error && <p className="mt-4 text-sm font-semibold text-rojo">{error}</p>}

      {/* Visor de la cámara */}
      <div id="lector-qr" className={`mt-4 max-w-sm overflow-hidden rounded-xl ${escaneando ? "" : "hidden"}`} />
      {escaneando && (
        <button onClick={detener} className="mt-3 text-sm font-semibold text-neutral-500 underline">
          Cancelar
        </button>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mt-6 max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          {!resultado.encontrado ? (
            <>
              <Circulo ok={false} />
              <p className="mt-3 font-display text-2xl font-extrabold text-rojo">Carné no válido</p>
              <p className="mt-1 text-sm text-neutral-600">No corresponde a ningún socio.</p>
            </>
          ) : (
            <>
              <Circulo ok={resultado.valido} aviso={resultado.valido && resultado.yaEntro} />
              <p
                className={`mt-3 font-display text-2xl font-extrabold ${
                  !resultado.valido
                    ? "text-rojo"
                    : resultado.yaEntro
                      ? "text-amber-600"
                      : "text-green-600"
                }`}
              >
                {!resultado.valido
                  ? "NO VÁLIDO"
                  : resultado.yaEntro
                    ? "YA HABÍA ENTRADO"
                    : "ACCESO VÁLIDO"}
              </p>
              {resultado.valido && resultado.yaEntro && (
                <p className="mt-1 text-sm font-semibold text-amber-700">
                  Entró a las {resultado.horaEntrada} (hace menos de 45 min). Comprueba la foto.
                </p>
              )}
              {resultado.valido && !resultado.yaEntro && (
                <p className="mt-1 text-sm text-green-700">Entrada registrada ✓</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-left">
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {resultado.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultado.foto_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-300">
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-azul-700">
                    {resultado.nombre} {resultado.apellidos}
                  </p>
                  <p className="text-sm text-neutral-500">Socio nº {resultado.numero_socio}</p>
                  <p className="text-sm text-neutral-700">{resultado.cuota ?? "—"}</p>
                  {!resultado.valido && (
                    <p className="text-sm font-semibold text-rojo">Estado: {resultado.estado}</p>
                  )}
                </div>
              </div>
            </>
          )}
          <button
            onClick={iniciar}
            className="mt-6 rounded-full bg-azul px-6 py-2.5 text-sm font-semibold text-white"
          >
            Escanear otro
          </button>
        </div>
      )}
    </div>
  );
}

function Circulo({ ok, aviso }: { ok: boolean; aviso?: boolean }) {
  const color = !ok ? "bg-rojo" : aviso ? "bg-amber-500" : "bg-green-500";
  return (
    <div
      className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold text-white ${color}`}
    >
      {!ok ? "✗" : aviso ? "!" : "✓"}
    </div>
  );
}
