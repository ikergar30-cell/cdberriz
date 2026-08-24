"use client";

import { useState } from "react";
import { renombrarEmpleado } from "./actions";

export function NombreEmpleado({ id, nombre }: { id: string; nombre: string }) {
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="font-medium text-neutral-900 hover:underline"
        title="Cambiar nombre"
      >
        {nombre}
      </button>
    );
  }

  return (
    <form action={renombrarEmpleado.bind(null, id)} className="flex items-center gap-2">
      <input
        name="nombre"
        defaultValue={nombre}
        autoFocus
        required
        className="rounded-lg border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
      />
      <button type="submit" className="text-xs font-semibold text-azul hover:underline">
        Guardar
      </button>
      <button
        type="button"
        onClick={() => setEditando(false)}
        className="text-xs text-neutral-400 hover:underline"
      >
        Cancelar
      </button>
    </form>
  );
}
