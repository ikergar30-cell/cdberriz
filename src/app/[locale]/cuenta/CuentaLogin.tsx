"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export function CuentaLogin() {
  const locale = useLocale();
  const eu = locale === "eu";
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/cuenta`,
      },
    });
    setEstado(error ? "error" : "enviado");
  }

  if (estado === "enviado") {
    return (
      <div className="rounded-2xl border border-azul-200 bg-azul-50 p-6 text-azul-800">
        <p className="font-semibold">
          {eu
            ? "Esteka bidali dugu zure emailera. Egin klik bertan sartzeko."
            : "Te hemos enviado un enlace a tu email. Haz clic en él para entrar."}
        </p>
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <p className="text-neutral-600">
        {eu
          ? "Idatzi bazkide gisa erabili zenuen emaila eta sartzeko esteka bat bidaliko dizugu."
          : "Escribe el email con el que te hiciste socio/a y te enviaremos un enlace para entrar."}
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@ejemplo.com"
        className={input}
        required
      />
      {estado === "error" && (
        <p className="text-sm font-semibold text-rojo">
          {eu ? "Errore bat gertatu da. Saiatu berriro." : "Ha ocurrido un error. Inténtalo de nuevo."}
        </p>
      )}
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
      >
        {estado === "enviando" ? "…" : eu ? "Bidali esteka" : "Enviar enlace"}
      </button>
    </form>
  );
}
