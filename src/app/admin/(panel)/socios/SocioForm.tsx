"use client";

import { useState } from "react";
import Link from "next/link";
import type { Socio, TipoAbono, EstadoSocio } from "@/lib/supabase/types";

const ESTADOS: { valor: EstadoSocio; label: string }[] = [
  { valor: "activo", label: "Activo" },
  { valor: "pendiente", label: "Pendiente" },
  { valor: "moroso", label: "Moroso" },
  { valor: "baja", label: "Baja" },
];

export function SocioForm({
  socio,
  tipos,
  accion,
}: {
  socio?: Socio;
  tipos: TipoAbono[];
  // Server action ligada con el id si es edición.
  accion: (formData: FormData) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setGuardando(true);
    try {
      await accion(formData);
    } catch (e) {
      // redirect() lanza una excepción especial de Next que NO es error real.
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
        return;
      }
      setError(e instanceof Error ? e.message : "Error al guardar.");
      setGuardando(false);
    }
  }

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const label = "mb-1 block text-sm font-semibold text-neutral-700";

  return (
    <form action={onSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nombre">Nombre *</label>
          <input id="nombre" name="nombre" defaultValue={socio?.nombre} className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="apellidos">Apellidos *</label>
          <input id="apellidos" name="apellidos" defaultValue={socio?.apellidos} className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={socio?.email ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="telefono">Teléfono</label>
          <input id="telefono" name="telefono" defaultValue={socio?.telefono ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="dni">DNI</label>
          <input id="dni" name="dni" defaultValue={socio?.dni ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
          <input id="fecha_nacimiento" name="fecha_nacimiento" type="date" defaultValue={socio?.fecha_nacimiento ?? ""} className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="direccion">Dirección</label>
          <input id="direccion" name="direccion" defaultValue={socio?.direccion ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="tipo_abono_id">Cuota</label>
          <select id="tipo_abono_id" name="tipo_abono_id" defaultValue={socio?.tipo_abono_id ?? ""} className={input}>
            <option value="">— Sin asignar —</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({(t.precio_cents / 100).toFixed(2)} €)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={socio?.estado ?? "pendiente"} className={input}>
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>{e.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="fecha_alta">Fecha de alta</label>
          <input id="fecha_alta" name="fecha_alta" type="date" defaultValue={socio?.fecha_alta ?? ""} className={input} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="miembros_familia">
          Miembros de la familia (abono familiar) — uno por línea
        </label>
        <textarea
          id="miembros_familia"
          name="miembros_familia"
          rows={3}
          defaultValue={(socio?.miembros_familia ?? []).map((m) => m.nombre).join("\n")}
          className={input}
        />
      </div>

      <div>
        <label className={label} htmlFor="notas">Notas internas</label>
        <textarea id="notas" name="notas" rows={3} defaultValue={socio?.notas ?? ""} className={input} />
      </div>

      {error && <p className="text-sm font-semibold text-rojo">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : socio ? "Guardar cambios" : "Crear socio"}
        </button>
        <Link href="/admin/socios" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
