"use client";

import { useRef, useState } from "react";
import { importarSocios, type FilaImport, type ResultadoFila } from "../actions";

const COLUMNAS: (keyof FilaImport)[] = [
  "nombre", "apellidos", "email", "telefono", "dni",
  "fecha_nacimiento", "cuota", "iban", "fecha_alta", "fecha_inicio_cobro", "notas",
];

const PLANTILLA = [
  COLUMNAS.join(","),
  "Iker,García,iker@ejemplo.com,612345678,12345678A,1990-05-15,individual,ES2100418000200300009200,2024-09-01,2026-09-01,",
  "Amaia,Etxeberria,amaia@ejemplo.com,634567890,,1985-03-22,familiar,ES9121000418450200051332,2023-09-01,2026-09-01,Familia con 3 hijos",
].join("\n");

function parsearCSV(texto: string): FilaImport[] {
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return [];

  const cabecera = lineas[0].split(",").map((c) => c.trim());
  return lineas.slice(1).map((linea) => {
    const valores = linea.split(",").map((v) => v.trim());
    const fila: Record<string, string> = {};
    cabecera.forEach((col, i) => { fila[col] = valores[i] ?? ""; });
    return {
      nombre: fila.nombre ?? "",
      apellidos: fila.apellidos ?? "",
      email: fila.email ?? "",
      telefono: fila.telefono || undefined,
      dni: fila.dni || undefined,
      fecha_nacimiento: fila.fecha_nacimiento || undefined,
      cuota: fila.cuota ?? "",
      iban: fila.iban || undefined,
      fecha_alta: fila.fecha_alta || undefined,
      fecha_inicio_cobro: fila.fecha_inicio_cobro || undefined,
      notas: fila.notas || undefined,
    };
  });
}

function descargarPlantilla() {
  const blob = new Blob([PLANTILLA], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla-socios-cdberriz.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type Estado = "idle" | "preview" | "importando" | "done";

export function ImportarSocios() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<FilaImport[]>([]);
  const [estado, setEstado] = useState<Estado>("idle");
  const [resultados, setResultados] = useState<ResultadoFila[]>([]);
  const [progreso, setProgreso] = useState(0);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texto = ev.target?.result as string;
      const parsed = parsearCSV(texto);
      setFilas(parsed);
      setEstado("preview");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function importar() {
    setEstado("importando");
    setProgreso(0);

    // Importar en lotes de 5 para no saturar Stripe ni Supabase
    const LOTE = 5;
    const res: ResultadoFila[] = [];
    for (let i = 0; i < filas.length; i += LOTE) {
      const lote = filas.slice(i, i + LOTE);
      const parcial = await importarSocios(lote);
      res.push(...parcial);
      setProgreso(Math.min(i + LOTE, filas.length));
    }

    setResultados(res);
    setEstado("done");
  }

  const ok = resultados.filter((r) => r.ok).length;
  const errores = resultados.filter((r) => !r.ok);

  return (
    <div className="space-y-6">

      {/* Paso 1: Descargar plantilla */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-neutral-900">
          1. Descarga la plantilla CSV
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Rellena una fila por socio. Las columnas <code>nombre</code>, <code>apellidos</code>,{" "}
          <code>email</code> y <code>cuota</code> son obligatorias.
          El campo <code>cuota</code> acepta: <code>joven</code>, <code>individual</code>,{" "}
          <code>familiar</code>, <code>jubilado</code>.
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Si rellenas <code>iban</code> y <code>fecha_inicio_cobro</code>, el socio se da de alta
          en Stripe automáticamente con domiciliación bancaria.
        </p>
        <button
          onClick={descargarPlantilla}
          className="mt-3 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          ↓ Descargar plantilla
        </button>
      </div>

      {/* Paso 2: Subir CSV */}
      {estado === "idle" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-display text-base font-bold text-neutral-900">
            2. Sube tu archivo CSV
          </h2>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFile}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-3 rounded-full bg-azul px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700"
          >
            Seleccionar archivo CSV
          </button>
        </div>
      )}

      {/* Paso 3: Vista previa */}
      {estado === "preview" && filas.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-neutral-900">
              3. Vista previa — {filas.length} socio(s)
            </h2>
            <button
              onClick={() => { setFilas([]); setEstado("idle"); if (inputRef.current) inputRef.current.value = ""; }}
              className="text-sm font-semibold text-neutral-400 hover:text-neutral-700"
            >
              Cambiar archivo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Cuota</th>
                  <th className="px-3 py-2">IBAN</th>
                  <th className="px-3 py-2">Primer cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filas.slice(0, 10).map((f, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 font-medium">{f.nombre} {f.apellidos}</td>
                    <td className="px-3 py-2 text-neutral-500">{f.email}</td>
                    <td className="px-3 py-2">{f.cuota}</td>
                    <td className="px-3 py-2 font-mono text-neutral-500">
                      {f.iban ? `${f.iban.slice(0, 4)}…${f.iban.slice(-4)}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-neutral-500">{f.fecha_inicio_cobro ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filas.length > 10 && (
              <p className="mt-2 text-xs text-neutral-400">
                Mostrando 10 de {filas.length}. Se importarán todos.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={importar}
              className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600"
            >
              Importar {filas.length} socio(s)
            </button>
            <p className="text-xs text-neutral-400">
              {filas.filter((f) => f.iban).length > 0 && (
                <>
                  {filas.filter((f) => f.iban).length} con IBAN → se darán de alta en Stripe
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Importando… */}
      {estado === "importando" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="font-semibold text-neutral-700">
            Importando socios… ({progreso} / {filas.length})
          </p>
          <div className="mx-auto mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-azul transition-all duration-300"
              style={{ width: `${Math.round((progreso / filas.length) * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-neutral-400">
            Creando clientes en Stripe, por favor espera…
          </p>
        </div>
      )}

      {/* Resultados */}
      {estado === "done" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="font-display text-base font-bold text-neutral-900">
            Importación completada
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            <span className="font-semibold text-green-700">{ok} importados correctamente</span>
            {errores.length > 0 && (
              <> · <span className="font-semibold text-rojo">{errores.length} con error</span></>
            )}
          </p>

          {errores.length > 0 && (
            <div className="mt-4 space-y-2">
              {errores.map((r, i) => (
                <div key={i} className="rounded-lg border border-rojo/20 bg-rojo-50 px-4 py-2 text-sm">
                  <span className="font-semibold">{r.nombre} {r.apellidos}:</span>{" "}
                  <span className="text-rojo">{r.error}</span>
                </div>
              ))}
            </div>
          )}

          <a
            href="/admin/socios"
            className="mt-5 inline-block rounded-full bg-azul px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700"
          >
            Ver lista de socios →
          </a>
        </div>
      )}
    </div>
  );
}
