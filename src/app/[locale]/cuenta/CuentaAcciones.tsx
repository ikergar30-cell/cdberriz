"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CuentaAcciones({ tienePago }: { tienePago: boolean }) {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function gestionar() {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Error");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el portal.");
      setCargando(false);
    }
  }

  async function salir() {
    await createClient().auth.signOut();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {tienePago && (
        <button
          onClick={gestionar}
          disabled={cargando}
          className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
        >
          {cargando ? "…" : eu ? "Nire kuota kudeatu" : "Gestionar mi cuota"}
        </button>
      )}
      {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
      <div>
        <button
          onClick={salir}
          className="text-sm font-semibold text-neutral-500 underline hover:text-neutral-800"
        >
          {eu ? "Saioa itxi" : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
