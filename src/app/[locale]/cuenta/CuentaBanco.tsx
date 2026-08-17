"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { actualizarIban } from "./actions";

export function CuentaBanco({ iban }: { iban: string | null }) {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(iban ?? "");
  const [error, setError] = useState<string | null>(null);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await actualizarIban(valor);
      if (r?.error) setError(r.error);
      else {
        setEditando(false);
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {eu ? "Kontu bankarioa" : "Cuenta bancaria"}
      </p>

      {!editando ? (
        <>
          <p className="font-mono text-sm font-semibold text-neutral-900">
            {iban || (eu ? "Ez dago gordeta" : "No hay ninguna guardada")}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {eu
              ? "Klubak kontu honetatik kobratzen du kuota zuzenean."
              : "El club domicilia tu cuota directamente en esta cuenta."}
          </p>
          <button
            onClick={() => { setEditando(true); setValor(iban ?? ""); }}
            className="mt-3 text-xs font-semibold text-azul underline hover:text-azul-700"
          >
            {eu ? "Kontua aldatu" : "Cambiar cuenta"}
          </button>
        </>
      ) : (
        <form onSubmit={guardar} className="space-y-3">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="ES00 0000 0000 0000 0000 0000"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20"
            style={{ fontFamily: "monospace" }}
            required
          />
          <p className="text-xs text-neutral-400">
            {eu
              ? "Aldaketa klubak eskuz eguneratu behar du bankuan; ez du kobrantzarik eragiten berehala."
              : "El cambio lo tiene que actualizar el club en el banco; no genera ningún cobro por sí solo."}
          </p>
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={pendiente}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 disabled:opacity-60"
            >
              {eu ? "Utzi" : "Cancelar"}
            </button>
            <button
              type="submit"
              disabled={pendiente}
              className="rounded-full bg-azul px-4 py-2 text-sm font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
            >
              {pendiente ? "…" : eu ? "Gorde" : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
