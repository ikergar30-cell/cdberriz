"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface Props {
  pedidoEn: string | null;
  tieneDireccion: boolean;
}

export function SolicitarCarnet({ pedidoEn, tieneDireccion }: Props) {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();

  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = new Date().getFullYear();
  const infoEntrega = eu
    ? `Entregazko epea: ${year}ko iraila. Lekua: Berrizburu Futbol Zelaia.`
    : `Entrega durante el mes de septiembre de ${year} en Berrizburu Futbol Zelaia.`;

  async function solicitar() {
    if (!tieneDireccion && !direccion.trim()) {
      setError(eu ? "Zure helbidea behar dugu." : "Introduce tu dirección.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/socios/solicitar-carnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion: direccion.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud.");
      setCargando(false);
    }
  }

  // Ya solicitado — mostrar confirmación.
  if (pedidoEn) {
    const fecha = new Date(pedidoEn).toLocaleDateString(eu ? "eu-ES" : "es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <p className="font-semibold text-green-800">
          {eu ? "Karnetaren eskaera jasota" : "Solicitud de carné recibida"}
        </p>
        <p className="mt-1 text-sm text-green-700">
          {eu
            ? `${fecha}an eskatu zenuen.`
            : `Solicitado el ${fecha}.`}{" "}
          {infoEntrega}
        </p>
      </div>
    );
  }

  // Pendiente de solicitar.
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-neutral-900">
        {eu ? "Karnet fisikoa eskatu" : "Solicitar carné físico"}
      </h2>
      <p className="mt-1 text-sm text-neutral-600">{infoEntrega}</p>

      {!tieneDireccion && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-neutral-700">
            {eu ? "Helbidea (zure profila osatzeko)" : "Dirección (para completar tu perfil)"}
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder={eu ? "Kalea, zenbakia, herria…" : "Calle, número, localidad…"}
            maxLength={300}
            className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-azul-600 focus:ring-2 focus:ring-azul-200"
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-rojo">{error}</p>}

      <button
        onClick={solicitar}
        disabled={cargando}
        className="mt-4 rounded-full bg-azul px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
      >
        {cargando
          ? "…"
          : eu
            ? "Karnet fisikoa eskatu"
            : "Solicitar carné físico"}
      </button>
    </div>
  );
}
