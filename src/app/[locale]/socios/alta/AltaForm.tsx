"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CUOTAS, type ClaveCuota } from "@/config/cuotas";
import { cuotaEfectiva, calcularEdad } from "@/lib/edad";
import { pickLocale } from "@/lib/locale";

export function AltaForm({ clave }: { clave: ClaveCuota }) {
  const locale = useLocale();
  const eu = locale === "eu";
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fechaNac, setFechaNac] = useState("");

  // Calcula en vivo qué cuota le corresponde por edad (solo informativo;
  // el precio real lo decide el servidor).
  const efectiva = fechaNac ? (cuotaEfectiva(clave, fechaNac) as ClaveCuota) : clave;
  const cambia = efectiva !== clave;
  const edad = fechaNac ? calcularEdad(fechaNac) : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const datos = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, clave, locale }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Error");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo continuar.");
      setCargando(false);
    }
  }

  const t = {
    nombre: eu ? "Izena" : "Nombre",
    apellidos: eu ? "Abizenak" : "Apellidos",
    email: "Email",
    telefono: eu ? "Telefonoa" : "Teléfono",
    fechaNac: eu ? "Jaiotze-data" : "Fecha de nacimiento",
    direccion: eu ? "Helbidea" : "Dirección",
    dni: eu ? "NAN / NIE (aukerakoa)" : "DNI / NIE (opcional)",
    continuar: eu ? "Ordaintzera joan" : "Ir al pago",
    aviso: eu
      ? "Ordainketa segurua Striperekin. Txartelez edo banku-helbideratzez (SEPA)."
      : "Pago seguro con Stripe. Con tarjeta o domiciliación bancaria (SEPA).",
  };

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const label = "mb-1 block text-sm font-semibold text-neutral-700";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nombre">{t.nombre} *</label>
          <input id="nombre" name="nombre" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="apellidos">{t.apellidos} *</label>
          <input id="apellidos" name="apellidos" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="email">{t.email} *</label>
          <input id="email" name="email" type="email" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="telefono">{t.telefono} *</label>
          <input id="telefono" name="telefono" type="tel" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="fecha_nacimiento">{t.fechaNac} *</label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            className={input}
            value={fechaNac}
            onChange={(e) => setFechaNac(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="dni">{t.dni}</label>
          <input id="dni" name="dni" className={input} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="direccion">{t.direccion} *</label>
        <input id="direccion" name="direccion" className={input} required />
      </div>

      {/* Aviso si por edad le corresponde otra cuota */}
      {cambia && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {eu
            ? `Zure adina dela eta (${edad} urte), dagokizun abonua ${pickLocale(
                CUOTAS[efectiva].nombre,
                locale,
              )} da (${CUOTAS[efectiva].precio} €/urte).`
            : `Por tu edad (${edad} años), te corresponde el abono ${pickLocale(
                CUOTAS[efectiva].nombre,
                locale,
              )} (${CUOTAS[efectiva].precio} €/año). Es lo que se cobrará.`}
        </div>
      )}

      {error && <p className="text-sm font-semibold text-rojo">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-full bg-rojo px-6 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60 sm:w-auto"
      >
        {cargando ? "…" : t.continuar}
      </button>
      <p className="text-xs text-neutral-500">{t.aviso}</p>
    </form>
  );
}
