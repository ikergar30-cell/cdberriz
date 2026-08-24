"use client";

import { useState } from "react";
import { actualizarEmpleado, eliminarEmpleado, reenviarEnlace } from "./actions";
import type { RolEmpleado } from "@/lib/supabase/types";

const estilosRol: Record<RolEmpleado, string> = {
  admin: "bg-blue-100 text-blue-700",
  empleado: "bg-green-100 text-green-700",
  verificador: "bg-orange-100 text-orange-700",
};

interface Props {
  id: string;
  nombre: string;
  email: string | null;
  rol: RolEmpleado;
  esYo: boolean;
  creado: string;
}

export function FilaEmpleado({ id, nombre, email, rol, esYo, creado }: Props) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <tr className="bg-azul-50/40">
        <td colSpan={5} className="px-5 py-4">
          <form action={actualizarEmpleado.bind(null, id)} className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
            <input
              name="nombre"
              defaultValue={nombre}
              required
              placeholder="Nombre"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
            <input
              name="email"
              type="email"
              defaultValue={email ?? ""}
              required
              placeholder="correo@ejemplo.com"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
            <select
              name="rol"
              defaultValue={rol}
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            >
              <option value="admin">admin</option>
              <option value="empleado">empleado</option>
              <option value="verificador">verificador</option>
            </select>
            <div className="flex items-center gap-3">
              <button type="submit" className="text-sm font-semibold text-azul hover:underline">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="text-sm text-neutral-400 hover:underline"
              >
                Cancelar
              </button>
            </div>
          </form>
          {rol === "verificador" && (
            <p className="mt-2 text-xs text-neutral-400">
              Si cambias el email de un &quot;verificador&quot;, avisa a quien lo usa: tendrá que
              entrar con el nuevo email en /admin/login-verificador.
            </p>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-5 py-3 font-medium text-neutral-900">{nombre}</td>
      <td className="px-5 py-3 text-neutral-500">{email ?? "—"}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estilosRol[rol]}`}>{rol}</span>
      </td>
      <td className="px-5 py-3 text-neutral-500">{creado}</td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-3">
          {rol !== "verificador" && email && (
            <form action={reenviarEnlace.bind(null, email)}>
              <button type="submit" className="text-xs font-semibold text-azul hover:underline">
                Reenviar enlace
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-xs font-semibold text-azul hover:underline"
          >
            Editar
          </button>
          {!esYo && (
            <form
              action={eliminarEmpleado.bind(null, id)}
              onSubmit={(e) => {
                if (!confirm(`¿Eliminar a "${nombre}"? Perderá el acceso al panel inmediatamente.`)) {
                  e.preventDefault();
                }
              }}
            >
              <button type="submit" className="text-xs font-semibold text-rojo hover:underline">
                Eliminar
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
