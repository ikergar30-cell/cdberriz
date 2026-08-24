"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginVerificadorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const res = await fetch("/api/admin/login-verificador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setError("Ese email no tiene acceso a verificar carnés.");
      setCargando(false);
      return;
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
          <p className="mt-1 text-sm text-neutral-500">Acceso solo con email, sin contraseña</p>
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
