"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PersonaPago, TipoPersonaPago } from "@/lib/supabase/types";

type Fila = {
  nombre: string;
  dni: string;
  importe: string;
  concepto: string;
  fecha: string;
};

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function mesActual() {
  return new Date().toISOString().slice(0, 7);
}

// Formulario de generación de resguardos: una fila = un PDF. Con una fila se
// descarga el PDF directamente; con varias, un ZIP con un PDF por persona.
export function FormResguardos({
  tipo,
  personas,
}: {
  tipo: TipoPersonaPago;
  personas: PersonaPago[];
}) {
  const router = useRouter();
  const esArbitro = tipo === "arbitro";
  const filaVacia = (): Fila => ({
    nombre: "",
    dni: "",
    importe: "",
    concepto: esArbitro ? "" : mesActual(),
    fecha: hoy(),
  });

  const [filas, setFilas] = useState<Fila[]>([filaVacia()]);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiar(i: number, campo: keyof Fila, valor: string) {
    setFilas((fs) => {
      const nuevas = fs.map((f, j) => (j === i ? { ...f, [campo]: valor } : f));
      // Si el nombre coincide con una persona conocida, autorrellenar su DNI.
      if (campo === "nombre") {
        const p = personas.find((x) => x.nombre.toLowerCase() === valor.toLowerCase());
        if (p) nuevas[i].dni = p.dni;
      }
      return nuevas;
    });
  }

  async function generar() {
    setError(null);
    setGenerando(true);
    try {
      const res = await fetch("/api/admin/resguardos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, filas }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "No se pudo generar el resguardo");
      }
      // Descargar el PDF/ZIP recibido.
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const nombre = /filename="([^"]+)"/.exec(disposition)?.[1] || "resguardos";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
      // Refrescar el historial y dejar el formulario listo para el siguiente.
      setFilas([filaVacia()]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el resguardo");
    } finally {
      setGenerando(false);
    }
  }

  const input =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      {/* Autocompletado con las personas ya registradas */}
      <datalist id="personas-conocidas">
        {personas.map((p) => (
          <option key={p.id} value={p.nombre} />
        ))}
      </datalist>

      <div className="space-y-4">
        {filas.map((f, i) => (
          <div
            key={i}
            className="grid gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr_1fr_auto]"
          >
            <div>
              <label className={label}>Nombre y apellidos</label>
              <input
                className={input}
                list="personas-conocidas"
                value={f.nombre}
                onChange={(e) => cambiar(i, "nombre", e.target.value)}
                placeholder="Nombre Apellidos"
              />
            </div>
            <div>
              <label className={label}>DNI</label>
              <input
                className={input}
                value={f.dni}
                onChange={(e) => cambiar(i, "dni", e.target.value)}
                placeholder="12345678A"
              />
            </div>
            <div>
              <label className={label}>Importe (€)</label>
              <input
                className={input}
                inputMode="decimal"
                value={f.importe}
                onChange={(e) => cambiar(i, "importe", e.target.value)}
                placeholder="40"
              />
            </div>
            <div>
              <label className={label}>{esArbitro ? "Partido" : "Mes"}</label>
              <input
                className={input}
                type={esArbitro ? "text" : "month"}
                value={f.concepto}
                onChange={(e) => cambiar(i, "concepto", e.target.value)}
                placeholder={esArbitro ? "C.D. Berriz - Zaldua (Infantil A)" : undefined}
              />
            </div>
            <div>
              <label className={label}>{esArbitro ? "Fecha partido" : "Fecha pago"}</label>
              <input
                className={input}
                type="date"
                value={f.fecha}
                onChange={(e) => cambiar(i, "fecha", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              {filas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setFilas((fs) => fs.filter((_, j) => j !== i))}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-400 transition hover:bg-rojo-50 hover:text-rojo"
                  aria-label="Quitar fila"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-rojo">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFilas((fs) => [...fs, filaVacia()])}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-azul hover:text-azul"
        >
          + Añadir fila
        </button>
        <button
          type="button"
          onClick={generar}
          disabled={generando}
          className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
        >
          {generando
            ? "Generando…"
            : filas.length === 1
              ? "Generar PDF"
              : `Generar ${filas.length} PDFs (ZIP)`}
        </button>
      </div>
    </div>
  );
}
