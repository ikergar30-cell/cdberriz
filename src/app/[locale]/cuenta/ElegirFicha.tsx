"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FichaPortal } from "@/lib/socios/sesionPortal";
import { elegirFichaPortal, olvidarFichaPortal } from "./actions";

// Pantalla "¿quién eres?": aparece cuando el email de la sesión lo comparten
// varias personas (matrimonios, 2º carné familiar, padre y madre socios por
// hijo/a…). La persona elige su ficha y se recuerda su elección.
export function ElegirFicha({ opciones }: { opciones: FichaPortal[] }) {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [elegido, setElegido] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function elegir(id: string) {
    setError(null);
    setElegido(id);
    startTransition(async () => {
      const r = await elegirFichaPortal(id);
      if (r?.error) {
        setError(r.error);
        setElegido(null);
      } else {
        router.refresh();
      }
    });
  }

  async function salir() {
    await createClient().auth.signOut();
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
      <h2 className="font-display text-xl font-bold text-neutral-900">
        {eu ? "Nor zara?" : "¿Quién eres?"}
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        {eu
          ? "Email honekin bazkide bat baino gehiago daude. Aukeratu zure fitxa jarraitzeko."
          : "Con este email hay más de un socio/a. Elige tu ficha para continuar."}
      </p>

      <ul className="mt-5 space-y-2">
        {opciones.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => elegir(o.id)}
              disabled={pendiente}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-left transition hover:border-azul hover:bg-azul-50 disabled:opacity-60"
            >
              <span className="font-semibold text-neutral-900">
                {o.nombre} {o.apellidos}
              </span>
              <span className="text-sm text-neutral-400">
                {pendiente && elegido === o.id
                  ? "…"
                  : `${eu ? "Bazkide zk." : "Socio nº"} ${o.numero_socio}`}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-sm font-semibold text-rojo">{error}</p>}

      <button
        type="button"
        onClick={salir}
        className="mt-5 text-sm font-semibold text-neutral-500 underline hover:text-neutral-800"
      >
        {eu ? "Saioa itxi" : "Cerrar sesión"}
      </button>
    </section>
  );
}

// Enlace discreto en el portal para volver a "¿quién eres?" (por si eligió mal
// la ficha). Solo se muestra cuando hay varias fichas con el mismo email.
export function CambiarFicha() {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function cambiar() {
    startTransition(async () => {
      await olvidarFichaPortal();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      disabled={pendiente}
      className="mt-1 text-xs font-semibold text-white/70 underline hover:text-white disabled:opacity-60"
    >
      {eu ? "Ez zara zu? Aldatu fitxa" : "¿No eres tú? Cambiar de ficha"}
    </button>
  );
}
