"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// El PIN de taquilla se recuerda en este dispositivo para no tener que
// teclearlo cada vez (solo la primera). Es el mismo código para todo el que
// abre la puerta, no una contraseña personal.
const CLAVE_PIN = "cdb_taquilla_pin";

export default function LoginVerificadorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Rellenar el PIN recordado en este dispositivo, si lo hay.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_PIN);
      if (guardado) setPin(guardado);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const res = await fetch("/api/admin/login-verificador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error || "Email o PIN incorrecto.");
      setCargando(false);
      return;
    }
    // Recordar el PIN en este dispositivo para las próximas veces.
    try {
      localStorage.setItem(CLAVE_PIN, pin);
    } catch {
      /* almacenamiento no disponible */
    }
    router.replace("/admin/verificar");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-azul-900 px-4">
      <Image
        src="/campo-noche.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-110 object-cover object-center blur-md"
      />
      <div className="absolute inset-0 bg-azul-900/75" />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/escudo.png"
            alt="C.D. Berriz"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
          <h1 className="mt-3 font-display text-xl font-extrabold uppercase text-azul-700">
            Verificar carné
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Acceso con email y PIN de taquilla</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="pin">
              PIN de taquilla
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20"
              required
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Se recuerda en este dispositivo: solo hay que ponerlo la primera vez.
            </p>
          </div>

          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-rojo px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
          >
            {cargando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <a href="/admin/login" className="mt-5 block text-center text-xs text-neutral-400 underline">
          Acceso con contraseña (resto del panel)
        </a>
      </div>
    </main>
  );
}
