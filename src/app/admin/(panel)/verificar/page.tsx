"use client";

import { useEffect, useRef, useState } from "react";

type Resultado =
  | { encontrado: false }
  | {
      encontrado: true;
      tipo: "socio" | "invitado";
      valido: boolean;
      yaEntro: boolean;
      horaEntrada: string | null;
      nombre: string;
      apellidos: string;
      numero_socio: number | null;
      estado: string;
      cuota: string | null;
      foto_url: string | null;
      entradaId: string | null;
      expiraEn?: string | null;
    };

export default function VerificarPage() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [mostrarManual, setMostrarManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  // Búsqueda manual: para cuando el socio no tiene el QR a mano. Con
  // cualquiera de los tres datos basta, pero si se rellena más de uno se
  // exigen todos a la vez (mayor garantía de que es esa persona).
  const [numeroSocio, setNumeroSocio] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [buscando, setBuscando] = useState(false);
  // El DNI/NIE es casi todo números salvo la letra final (o la inicial en un
  // NIE): se abre con teclado numérico para ir más rápido, con opción de
  // cambiar a letras cuando toque escribirla.
  const [dniTeclado, setDniTeclado] = useState<"numerico" | "letras">("numerico");
  const dniRef = useRef<HTMLInputElement>(null);

  // Deshacer un registro por error (nº de socio equivocado, doble pulsación…).
  const [cancelando, setCancelando] = useState(false);
  const [cancelado, setCancelado] = useState(false);

  async function iniciar() {
    setResultado(null);
    setError(null);
    setMostrarManual(false);
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
          await comprobar({ token });
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

  function abrirManual() {
    setResultado(null);
    setError(null);
    setMostrarManual(true);
  }

  async function comprobar(datos: { token?: string; numero_socio?: string; email?: string; dni?: string }) {
    setCancelado(false);
    try {
      const res = await fetch("/api/admin/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      setResultado(await res.json());
    } catch {
      setError("Error al verificar.");
    }
  }

  async function cancelarRegistro(entradaId: string) {
    setError(null);
    setCancelando(true);
    try {
      const res = await fetch("/api/admin/verificar/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entradaId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo deshacer el registro.");
      setCancelado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo deshacer el registro.");
    } finally {
      setCancelando(false);
    }
  }

  async function buscarManual(e: React.FormEvent) {
    e.preventDefault();
    if (!numeroSocio.trim() && !email.trim() && !dni.trim()) {
      setError("Rellena al menos el nº de socio, el email o el DNI.");
      return;
    }
    setError(null);
    setBuscando(true);
    await comprobar({
      numero_socio: numeroSocio.trim() || undefined,
      email: email.trim() || undefined,
      dni: dni.trim() || undefined,
    });
    setBuscando(false);
    setMostrarManual(false);
  }

  // Al salir de la página, apagar la cámara.
  useEffect(() => () => void detener(), []);

  const pantallaInicial = !escaneando && !mostrarManual && !resultado;

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold uppercase text-neutral-900">
        Verificar carné
      </h1>

      {pantallaInicial && (
        <>
          <div className="mb-6 max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
            <p className="mb-3 font-semibold text-neutral-900">Cómo funciona</p>
            <ol className="mb-4 list-decimal space-y-1.5 pl-5">
              <li>
                Pulsa <span className="font-semibold">&quot;Abrir cámara y escanear&quot;</span> y
                apunta al código QR del carné del socio (en su móvil o en el carné físico).
              </li>
              <li>La app lo lee sola, no hace falta pulsar nada más.</li>
              <li>Deja pasar según el color que salga (abajo tienes el significado de cada uno).</li>
              <li>
                Para el siguiente socio, pulsa <span className="font-semibold">&quot;Escanear otro&quot;</span>.
              </li>
            </ol>
            <p className="mb-3 text-neutral-600">
              Si el socio no tiene el QR a mano, puedes buscarlo con su nº de socio, email o DNI
              pulsando <span className="font-semibold">&quot;Buscar sin QR&quot;</span>.
            </p>
            <p className="mb-3 text-neutral-600">
              Los QR de invitación temporal (ver{" "}
              <a href="/admin/invitados" className="font-semibold text-azul underline">
                Invitados
              </a>
              ) se escanean igual, aquí mismo.
            </p>
            <p className="mb-2 font-semibold text-neutral-900">Qué significa cada resultado</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-green-500" />
                <span>
                  <span className="font-semibold text-green-700">Acceso válido</span> — el socio está
                  activo. Se registra la entrada automáticamente, puede pasar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <span className="font-semibold text-amber-700">Ya había entrado</span> — ese mismo
                  carné ya se verificó hace menos de 40 minutos. Compara la foto con la persona: puede
                  ser una reentrada normal, o que el carné se esté compartiendo.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-rojo" />
                <span>
                  <span className="font-semibold text-rojo">No válido</span> — el socio no está al
                  corriente de pago (o de baja). No debe pasar; si tiene dudas, que hable con el club.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={iniciar}
              className="rounded-full bg-rojo px-6 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600"
            >
              Abrir cámara y escanear
            </button>
            <button
              onClick={abrirManual}
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-azul hover:text-azul"
            >
              Buscar sin QR
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-4 text-sm font-semibold text-rojo">{error}</p>}

      {/* Visor de la cámara */}
      <div id="lector-qr" className={`mt-4 max-w-sm overflow-hidden rounded-xl ${escaneando ? "" : "hidden"}`} />
      {escaneando && (
        <button onClick={detener} className="mt-3 text-sm font-semibold text-neutral-500 underline">
          Cancelar
        </button>
      )}

      {/* Búsqueda manual */}
      {mostrarManual && (
        <form onSubmit={buscarManual} className="mt-4 max-w-sm rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="mb-1 font-display text-lg font-bold text-neutral-900">Buscar sin QR</p>
          <p className="mb-4 text-sm text-neutral-500">
            Rellena al menos un dato. Si rellenas varios, tienen que coincidir todos.
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Nº de socio</label>
              <input
                type="number"
                inputMode="numeric"
                value={numeroSocio}
                onChange={(e) => setNumeroSocio(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-600">DNI / NIE</label>
                <button
                  type="button"
                  onClick={() => {
                    setDniTeclado((v) => (v === "numerico" ? "letras" : "numerico"));
                    // Cambiar el teclado a medio escribir exige reenfocar el
                    // campo: la mayoría de móviles no cambian el teclado en
                    // caliente si el input ya tiene el foco.
                    dniRef.current?.blur();
                    setTimeout(() => dniRef.current?.focus(), 0);
                  }}
                  className="text-xs font-semibold text-azul underline"
                >
                  {dniTeclado === "numerico" ? "Cambiar a letras" : "Cambiar a números"}
                </button>
              </div>
              <input
                ref={dniRef}
                type="text"
                inputMode={dniTeclado === "numerico" ? "numeric" : "text"}
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
              />
              <p className="mt-1 text-xs text-neutral-400">
                No hace falta la letra: con los números del DNI ya vale.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={buscando}
              className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
            >
              {buscando ? "Buscando…" : "Buscar"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarManual(false)}
              className="text-sm font-semibold text-neutral-500 underline"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mt-6 max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          {!resultado.encontrado ? (
            <>
              <Circulo ok={false} />
              <p className="mt-3 font-display text-2xl font-extrabold text-rojo">Carné no válido</p>
              <p className="mt-1 text-sm text-neutral-600">
                No corresponde a ningún socio (o hay varios con esos datos: prueba con más campos).
              </p>
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
                  Entró a las {resultado.horaEntrada} (hace menos de 40 min). Comprueba la foto.
                </p>
              )}
              {resultado.valido && !resultado.yaEntro && (
                <>
                  {cancelado ? (
                    <p className="mt-1 text-sm font-semibold text-neutral-600">
                      Registro deshecho. Esta entrada no cuenta.
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-green-700">Entrada registrada ✓</p>
                      {resultado.entradaId && (
                        <button
                          onClick={() => cancelarRegistro(resultado.entradaId!)}
                          disabled={cancelando}
                          className="mt-1 text-xs font-semibold text-rojo underline disabled:opacity-60"
                        >
                          {cancelando ? "Deshaciendo…" : "¿Te has equivocado? Deshacer registro"}
                        </button>
                      )}
                    </>
                  )}
                </>
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
                  {resultado.tipo === "invitado" ? (
                    <>
                      <span className="inline-block rounded-full bg-azul-50 px-2 py-0.5 text-xs font-semibold text-azul-700">
                        Invitado/a
                      </span>
                      {resultado.expiraEn && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Válida hasta{" "}
                          {new Date(resultado.expiraEn).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500">Socio nº {resultado.numero_socio}</p>
                  )}
                  <p className="text-sm text-neutral-700">{resultado.cuota ?? "—"}</p>
                  {!resultado.valido && (
                    <p className="text-sm font-semibold text-rojo">Estado: {resultado.estado}</p>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={iniciar}
              className="rounded-full bg-azul px-5 py-2.5 text-sm font-semibold text-white"
            >
              Escanear otro
            </button>
            <button
              onClick={abrirManual}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:border-azul hover:text-azul"
            >
              Buscar sin QR
            </button>
          </div>
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
