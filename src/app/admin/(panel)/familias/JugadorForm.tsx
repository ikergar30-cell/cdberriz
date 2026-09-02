"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Jugador } from "@/lib/supabase/types";
import { ERROR_GENERICO, type ActionResult } from "@/lib/actionResult";

export interface SocioParaVincular {
  id: string;
  nombre: string;
  apellidos: string;
  numero_socio: number;
}

function etiqueta(s: SocioParaVincular) {
  return `${s.nombre} ${s.apellidos} — nº${s.numero_socio}`;
}

function BuscadorSocio({
  id,
  name,
  label,
  socios,
  valorInicial,
}: {
  id: string;
  name: string;
  label: string;
  socios: SocioParaVincular[];
  valorInicial: SocioParaVincular | null;
}) {
  const [busqueda, setBusqueda] = useState(valorInicial ? etiqueta(valorInicial) : "");
  const [socioId, setSocioId] = useState(valorInicial?.id ?? "");
  const mapa = useMemo(() => new Map(socios.map((s) => [etiqueta(s), s])), [socios]);

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-neutral-700" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        list={`${id}-options`}
        placeholder="Escribe el nombre o número de socio…"
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          const match = mapa.get(e.target.value);
          setSocioId(match?.id ?? "");
        }}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20"
      />
      <datalist id={`${id}-options`}>
        {socios.map((s) => (
          <option key={s.id} value={etiqueta(s)} />
        ))}
      </datalist>
      <input type="hidden" name={name} value={socioId} />
      {busqueda && !socioId && (
        <p className="mt-1 text-xs font-semibold text-rojo">
          No coincide con ningún socio/a de la lista. Elige una opción del desplegable.
        </p>
      )}
    </div>
  );
}

export function JugadorForm({
  jugador,
  socios,
  accion,
}: {
  jugador?: Jugador & {
    madre?: SocioParaVincular | null;
    padre?: SocioParaVincular | null;
  };
  socios: SocioParaVincular[];
  accion: (formData: FormData) => Promise<ActionResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setGuardando(true);
    try {
      const resultado = await accion(formData);
      if (resultado?.error) {
        setError(resultado.error);
        setGuardando(false);
      }
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
        return;
      }
      setError(ERROR_GENERICO);
      setGuardando(false);
    }
  }

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const label = "mb-1 block text-sm font-semibold text-neutral-700";

  return (
    <form action={onSubmit} className="max-w-xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nombre">Nombre *</label>
          <input id="nombre" name="nombre" defaultValue={jugador?.nombre} required className={input} />
        </div>
        <div>
          <label className={label} htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" name="apellidos" defaultValue={jugador?.apellidos ?? ""} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="equipo">Equipo</label>
          <input
            id="equipo"
            name="equipo"
            defaultValue={jugador?.equipo ?? ""}
            placeholder="Ej: Alevín 2016"
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="temporada">Temporada</label>
          <input
            id="temporada"
            name="temporada"
            defaultValue={jugador?.temporada ?? ""}
            placeholder="Ej: 2026-2027"
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            defaultValue={jugador?.fecha_nacimiento ?? ""}
            className={input}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-neutral-100 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Padres/madres (al menos uno tiene que ser socio/a)
        </p>
        <BuscadorSocio
          id="madre"
          name="madre_socio_id"
          label="Madre"
          socios={socios}
          valorInicial={jugador?.madre ?? null}
        />
        <BuscadorSocio
          id="padre"
          name="padre_socio_id"
          label="Padre"
          socios={socios}
          valorInicial={jugador?.padre ?? null}
        />
        <p className="text-xs text-neutral-400">
          ¿No aparece? Créalo primero como socio (&quot;por hijo/a jugando&quot;) desde{" "}
          <Link href="/admin/socios/nuevo" className="font-semibold text-azul underline">
            Nuevo socio
          </Link>
          .
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rojo/30 bg-rojo-50 p-4 text-sm font-semibold text-rojo">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : jugador ? "Guardar cambios" : "Crear jugador/a"}
        </button>
        <Link href="/admin/familias" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
