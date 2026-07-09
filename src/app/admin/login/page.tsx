"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    // Redirigir según el rol del empleado.
    const { data: { user } } = await supabase.auth.getUser();
    const { data: perfil } = user
      ? await supabase.from("perfiles").select("rol").eq("id", user.id).single()
      : { data: null };
    const destino = perfil?.rol === "verificador" ? "/admin/verificar" : "/admin";
    router.replace(destino);
    router.refresh();
  }

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-azul-900 px-4">
      {/* Foto del campo de fútbol como fondo, difuminada y oscurecida para no
          competir con el formulario. */}
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
            Intranet C.D. Berriz
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Acceso para empleados del club</p>
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
              className={input}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              required
              autoComplete="current-password"
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
      </div>
    </main>
  );
}
