"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

type Estado = "idle" | "enviando" | "ok" | "error";

export function ContactForm() {
  const t = useTranslations("contacto");
  const locale = useLocale();
  const [estado, setEstado] = useState<Estado>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("enviando");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setEstado("ok");
      form.reset();
    } catch {
      setEstado("error");
    }
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const labelCls = "mb-1 block text-sm font-semibold text-neutral-700";

  const msg = {
    ok:
      locale === "eu"
        ? "Eskerrik asko! Mezua bidali da."
        : "¡Gracias! Tu mensaje se ha enviado.",
    error:
      locale === "eu"
        ? "Ezin izan da bidali. Saiatu berriro edo idatzi g:"
        : "No se ha podido enviar. Inténtalo de nuevo o escribe a:",
  };

  if (estado === "ok") {
    return (
      <div className="rounded-2xl border border-azul-200 bg-azul-50 p-6 text-azul-800">
        <p className="font-semibold">✓ {msg.ok}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="nombre">
            {t("nombre")}
          </label>
          <input id="nombre" name="nombre" className={inputCls} required />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={inputCls}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="asunto">
          {t("asunto")}
        </label>
        <input id="asunto" name="asunto" className={inputCls} />
      </div>

      <div>
        <label className={labelCls} htmlFor="mensaje">
          {t("mensaje")}
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={5}
          className={inputCls}
          required
        />
      </div>

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
      >
        {estado === "enviando" ? "…" : t("enviar")}
      </button>

      {estado === "error" && (
        <p className="text-sm font-semibold text-rojo">
          {msg.error}{" "}
          <a className="underline" href="mailto:coordinacioncdberriz@gmail.com">
            coordinacioncdberriz@gmail.com
          </a>
        </p>
      )}
    </form>
  );
}
