"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { iniciarSesionPortal } from "./actions";

export function CuentaLogin() {
  const locale = useLocale();
  const eu = locale === "eu";
  const [valor, setValor] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const r = await iniciarSesionPortal(valor, locale);
    setEstado(r?.error ? "error" : "enviado");
  }

  if (estado === "enviado") {
    return (
      <div className="rounded-2xl border border-azul-200 bg-azul-50 p-6 text-azul-800">
        <p className="font-semibold">
          {eu
            ? "Zure emaila gure erregistroetan badago, esteka bat bidali dugu. Egin klik bertan sartzeko."
            : "Si tu email está en nuestros registros, te hemos enviado un enlace. Haz clic en él para entrar."}
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
          ? "Idatzi zure emaila, NANa edo bazkide zenbakia, eta sartzeko esteka bat bidaliko dizugu zure emailera."
          : "Escribe tu email, DNI o número de socio, y te enviaremos un enlace de acceso a tu email."}
      </p>
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={eu ? "Emaila, NANa edo bazkide zk." : "Email, DNI o nº de socio"}
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
