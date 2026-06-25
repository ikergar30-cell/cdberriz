"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

export function NewsletterForm() {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  const textos = {
    titulo: locale === "eu" ? "Berrien egunekaria" : "Boletín de noticias",
    descripcion:
      locale === "eu"
        ? "Klubeko azken berriak jaso ezazu emailez."
        : "Recibe las últimas noticias del club en tu correo.",
    placeholder: locale === "eu" ? "Zure emaila" : "Tu email",
    boton: locale === "eu" ? "Harpidetu" : "Suscribirse",
    ok:
      locale === "eu"
        ? "Eskerrik asko! Harpidetu zara."
        : "¡Gracias! Ya estás suscrito.",
    error:
      locale === "eu"
        ? "Errore bat gertatu da. Saiatu berriro."
        : "Algo ha fallado. Inténtalo de nuevo.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setEstado("enviando");
    try {
      const res = await fetch("/api/newsletter/suscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setEstado(res.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  return (
    <div>
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
        {textos.titulo}
      </h3>
      <p className="mt-2 text-sm text-azul-200">{textos.descripcion}</p>

      {estado === "ok" ? (
        <p className="mt-4 text-sm font-semibold text-dorado">{textos.ok}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={textos.placeholder}
            className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-azul-300 outline-none ring-1 ring-white/20 focus:ring-dorado"
          />
          <button
            type="submit"
            disabled={estado === "enviando"}
            className="shrink-0 rounded-lg bg-dorado px-4 py-2 text-sm font-bold text-azul-900 transition hover:bg-yellow-400 disabled:opacity-60"
          >
            {estado === "enviando" ? "…" : textos.boton}
          </button>
        </form>
      )}

      {estado === "error" && (
        <p className="mt-2 text-xs text-red-400">{textos.error}</p>
      )}
    </div>
  );
}
