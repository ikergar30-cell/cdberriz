"use client";

import { useState } from "react";
import {
  cancelarRenovacion,
  reactivarRenovacion,
  reembolsarYCancelar,
} from "../actions";

export function AccionesAbono({
  socioId,
  tieneSuscripcion,
  cancelacionProgramada,
  elegibleReembolso,
  diasRestantesReembolso,
}: {
  socioId: string;
  tieneSuscripcion: boolean;
  cancelacionProgramada: boolean;
  elegibleReembolso: boolean;
  diasRestantesReembolso: number | null;
}) {
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(nombre: string, accion: () => Promise<void>, confirmacion: string) {
    if (!confirm(confirmacion)) return;
    setError(null);
    setCargando(nombre);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
    } finally {
      setCargando(null);
    }
  }

  if (!tieneSuscripcion) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
      {error && (
        <p className="rounded-lg border border-rojo/30 bg-rojo-50 p-3 text-sm font-semibold text-rojo">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {elegibleReembolso && (
          <button
            type="button"
            disabled={cargando !== null}
            onClick={() =>
              ejecutar(
                "reembolsar",
                () => reembolsarYCancelar(socioId),
                `¿Reembolsar el último pago y dar de baja al socio? Está dentro del plazo de ${diasRestantesReembolso} día(s) restantes. Esta acción no se puede deshacer.`,
              )
            }
            className="rounded-full border border-rojo px-4 py-2 text-sm font-semibold text-rojo transition hover:bg-rojo hover:text-white disabled:opacity-60"
          >
            {cargando === "reembolsar" ? "Reembolsando…" : "Reembolsar y dar de baja"}
          </button>
        )}

        {cancelacionProgramada ? (
          <button
            type="button"
            disabled={cargando !== null}
            onClick={() =>
              ejecutar(
                "reactivar",
                () => reactivarRenovacion(socioId),
                "¿Reactivar la renovación automática de este socio?",
              )
            }
            className="rounded-full border border-azul px-4 py-2 text-sm font-semibold text-azul transition hover:bg-azul hover:text-white disabled:opacity-60"
          >
            {cargando === "reactivar" ? "Reactivando…" : "Deshacer cancelación"}
          </button>
        ) : (
          <button
            type="button"
            disabled={cargando !== null}
            onClick={() =>
              ejecutar(
                "cancelar",
                () => cancelarRenovacion(socioId),
                "¿Cancelar la renovación automática? El socio seguirá activo hasta el final del periodo ya pagado y después pasará a baja.",
              )
            }
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-rojo hover:text-rojo disabled:opacity-60"
          >
            {cargando === "cancelar" ? "Cancelando…" : "Cancelar renovación"}
          </button>
        )}
      </div>
    </div>
  );
}
