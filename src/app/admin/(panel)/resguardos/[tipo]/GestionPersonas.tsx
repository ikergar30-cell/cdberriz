"use client";

import { useState } from "react";
import type { PersonaPago, TipoPersonaPago } from "@/lib/supabase/types";
import { crearPersona, actualizarPersona, eliminarPersona } from "./personas-actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

// Gestión del padrón de árbitros/entrenadores: alta, edición inline y borrado.
// Estas personas alimentan el autocompletado del formulario de resguardos.
export function GestionPersonas({
  tipo,
  personas,
}: {
  tipo: TipoPersonaPago;
  personas: PersonaPago[];
}) {
  const esArbitro = tipo === "arbitro";
  const singular = esArbitro ? "árbitro" : "entrenador";

  // Abierto por defecto: dar de alta y mantener el listado (con equipo e
  // importe de cada entrenador) es una tarea habitual, no conviene ocultarla.
  const [abierto, setAbierto] = useState(true);
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [equipo, setEquipo] = useState("");
  const [importe, setImporte] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDni, setEditDni] = useState("");
  const [editEquipo, setEditEquipo] = useState("");
  const [editImporte, setEditImporte] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const importeStr = (cents: number | null) =>
    cents == null ? "" : String(cents / 100).replace(".", ",");

  async function anadir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const fd = new FormData();
      fd.set("nombre", nombre);
      fd.set("dni", dni);
      if (!esArbitro) {
        fd.set("equipo", equipo);
        fd.set("importe", importe);
      }
      const resultado = await crearPersona(tipo, fd);
      if (resultado?.error) {
        setError(resultado.error);
        return;
      }
      setNombre("");
      setDni("");
      setEquipo("");
      setImporte("");
    } catch {
      setError(ERROR_GENERICO);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion(id: string) {
    setError(null);
    setGuardando(true);
    try {
      const fd = new FormData();
      fd.set("nombre", editNombre);
      fd.set("dni", editDni);
      if (!esArbitro) {
        fd.set("equipo", editEquipo);
        fd.set("importe", editImporte);
      }
      const resultado = await actualizarPersona(id, tipo, fd);
      if (resultado?.error) {
        setError(resultado.error);
        return;
      }
      setEditando(null);
    } catch {
      setError(ERROR_GENERICO);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string, nombrePersona: string) {
    if (
      !confirm(
        `¿Eliminar a ${nombrePersona}? Se borrarán también sus resguardos registrados.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      const resultado = await eliminarPersona(id, tipo);
      if (resultado?.error) setError(resultado.error);
    } catch {
      setError(ERROR_GENERICO);
    }
  }

  const input =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={abierto}
      >
        <span className="font-display text-sm font-bold uppercase tracking-wide text-neutral-700">
          {esArbitro ? "Árbitros" : "Entrenadores"} registrados
          <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
            {personas.length}
          </span>
        </span>
        <span className="text-neutral-400">{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div className="border-t border-neutral-100 p-5">
          {/* Alta */}
          <form
            onSubmit={anadir}
            className={`grid gap-3 ${
              esArbitro
                ? "sm:grid-cols-[2fr_1fr_auto]"
                : "sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr_1fr_auto]"
            }`}
          >
            <input
              className={input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Nombre y apellidos del ${singular}`}
              required
            />
            <input
              className={input}
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="DNI"
              required
            />
            {!esArbitro && (
              <>
                <input
                  className={input}
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                  placeholder="Equipo (p. ej. Cadete)"
                />
                <input
                  className={input}
                  inputMode="decimal"
                  value={importe}
                  onChange={(e) => setImporte(e.target.value)}
                  placeholder="Importe/mes €"
                />
              </>
            )}
            <button
              type="submit"
              disabled={guardando}
              className="rounded-full bg-azul px-5 py-2 text-sm font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
            >
              Añadir
            </button>
          </form>

          {error && <p className="mt-3 text-sm font-semibold text-rojo">{error}</p>}

          {/* Listado */}
          {personas.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">
              Todavía no hay {esArbitro ? "árbitros" : "entrenadores"} registrados.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-2.5">Nombre y apellidos</th>
                    <th className="px-4 py-2.5">DNI</th>
                    {!esArbitro && (
                      <>
                        <th className="px-4 py-2.5">Equipo</th>
                        <th className="px-4 py-2.5 text-right">Importe/mes</th>
                      </>
                    )}
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {personas.map((p) => (
                    <tr key={p.id}>
                      {editando === p.id ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              className={input}
                              value={editNombre}
                              onChange={(e) => setEditNombre(e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              className={input}
                              value={editDni}
                              onChange={(e) => setEditDni(e.target.value)}
                            />
                          </td>
                          {!esArbitro && (
                            <>
                              <td className="px-4 py-2">
                                <input
                                  className={input}
                                  value={editEquipo}
                                  onChange={(e) => setEditEquipo(e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  className={input}
                                  inputMode="decimal"
                                  value={editImporte}
                                  onChange={(e) => setEditImporte(e.target.value)}
                                />
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => guardarEdicion(p.id)}
                              disabled={guardando}
                              className="font-semibold text-azul hover:underline disabled:opacity-60"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="ml-3 text-neutral-400 hover:text-neutral-700"
                            >
                              Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 font-semibold text-neutral-800">
                            {p.nombre}
                          </td>
                          <td className="px-4 py-2.5 text-neutral-600">{p.dni}</td>
                          {!esArbitro && (
                            <>
                              <td className="px-4 py-2.5 text-neutral-600">{p.equipo ?? "—"}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-neutral-800">
                                {p.importe_cents != null
                                  ? (p.importe_cents / 100).toLocaleString("es-ES", {
                                      style: "currency",
                                      currency: "EUR",
                                    })
                                  : "—"}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditando(p.id);
                                setEditNombre(p.nombre);
                                setEditDni(p.dni);
                                setEditEquipo(p.equipo ?? "");
                                setEditImporte(importeStr(p.importe_cents));
                                setError(null);
                              }}
                              className="font-semibold text-neutral-500 hover:text-azul"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => borrar(p.id, p.nombre)}
                              className="ml-3 font-semibold text-neutral-400 hover:text-rojo"
                            >
                              Eliminar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
