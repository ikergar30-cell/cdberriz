"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CampoPortal } from "@/lib/socios/camposFaltantes";
import { completarDatosSocio } from "./actions";

// Formulario que se muestra al socio en su portal cuando le faltan datos:
// solo aparecen los campos que realmente le faltan (ver camposFaltantesPortal)
// y hasta que no los rellene no ve su carné. "campos" viene calculado en el
// servidor a partir de su ficha real.
type MetaCampo = {
  label: string;
  labelEu: string;
  type: string;
  inputMode?: "text" | "numeric" | "tel";
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
};

const CAMPOS: Record<CampoPortal, MetaCampo> = {
  dni: { label: "DNI / NIE", labelEu: "DNI / NIE", type: "text", autoComplete: "off", placeholder: "12345678A" },
  telefono: { label: "Teléfono", labelEu: "Telefonoa", type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "600000000" },
  direccion: { label: "Dirección", labelEu: "Helbidea", type: "text", autoComplete: "street-address" },
  poblacion: { label: "Población", labelEu: "Herria", type: "text", autoComplete: "address-level2" },
  codigo_postal: { label: "Código postal", labelEu: "Posta kodea", type: "text", inputMode: "numeric", autoComplete: "postal-code", placeholder: "48240", maxLength: 5 },
  fecha_nacimiento: { label: "Fecha de nacimiento", labelEu: "Jaiotze-data", type: "date", autoComplete: "bday" },
};

export function CompletarDatos({ campos }: { campos: CampoPortal[] }) {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await completarDatosSocio(locale, formData);
      if (r?.error) setError(r.error);
      else router.refresh(); // ficha completa → el portal ya muestra el carné
    });
  }

  async function salir() {
    await createClient().auth.signOut();
    router.refresh();
  }

  const input =
    "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-azul focus:ring-2 focus:ring-azul/20";

  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-6 md:p-8">
      <h2 className="font-display text-xl font-bold text-neutral-900">
        {eu ? "Osatu zure datuak" : "Completa tus datos"}
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        {eu
          ? "Zure karneta ikusi baino lehen, falta diren datuak osatu behar dituzu. Behin bakarrik eskatuko dizugu."
          : "Antes de ver tu carné necesitamos que completes los datos que faltan. Solo te lo pediremos una vez."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
        {campos.map((campo) => {
          const m = CAMPOS[campo];
          const soloUno = campo === "direccion"; // la dirección ocupa toda la fila
          return (
            <div key={campo} className={soloUno ? "sm:col-span-2" : ""}>
              <label htmlFor={campo} className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {eu ? m.labelEu : m.label}
              </label>
              <input
                id={campo}
                name={campo}
                type={m.type}
                inputMode={m.inputMode}
                autoComplete={m.autoComplete}
                placeholder={m.placeholder}
                maxLength={m.maxLength}
                required
                disabled={pendiente}
                className={input}
              />
            </div>
          );
        })}

        {error && (
          <p className="sm:col-span-2 rounded-lg bg-rojo/10 px-3 py-2 text-sm font-semibold text-rojo">
            {error}
          </p>
        )}

        <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pendiente}
            className="rounded-full bg-azul px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
          >
            {pendiente
              ? eu ? "Gordetzen…" : "Guardando…"
              : eu ? "Gorde eta jarraitu" : "Guardar y continuar"}
          </button>
          <button
            type="button"
            onClick={salir}
            className="text-sm font-semibold text-neutral-500 underline hover:text-neutral-800"
          >
            {eu ? "Ez naiz ni · saioa itxi" : "No soy yo · cerrar sesión"}
          </button>
        </div>
      </form>
    </section>
  );
}
