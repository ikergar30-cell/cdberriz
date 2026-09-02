import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { normaliza } from "@/lib/texto";

interface FilaJugador {
  id: string;
  nombre: string;
  apellidos: string | null;
  equipo: string | null;
  temporada: string | null;
  madre: { id: string; nombre: string; apellidos: string; numero_socio: number } | null;
  padre: { id: string; nombre: string; apellidos: string; numero_socio: number } | null;
}

export default async function FamiliasPage({
  searchParams,
}: {
  searchParams: { q?: string; equipo?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const equipoFiltro = searchParams.equipo ?? "";

  const supabase = createClient();
  const { data, error } = await supabase
    .from("jugadores")
    .select(
      "id, nombre, apellidos, equipo, temporada, madre:madre_socio_id(id, nombre, apellidos, numero_socio), padre:padre_socio_id(id, nombre, apellidos, numero_socio)",
    )
    .order("equipo")
    .order("nombre");

  let jugadores = (data as unknown as FilaJugador[]) ?? [];

  const equipos = Array.from(new Set(jugadores.map((j) => j.equipo).filter(Boolean))).sort() as string[];

  if (equipoFiltro) jugadores = jugadores.filter((j) => j.equipo === equipoFiltro);
  if (q) {
    const buscado = normaliza(q);
    jugadores = jugadores.filter((j) =>
      normaliza(
        `${j.nombre} ${j.apellidos ?? ""} ${j.madre?.nombre ?? ""} ${j.madre?.apellidos ?? ""} ${j.padre?.nombre ?? ""} ${j.padre?.apellidos ?? ""}`,
      ).includes(buscado),
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
            Familias / Jugadores
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Cada jugador/a de cantera enlazado con sus padres/madres socios. De aquí sale que, si
            ambos son socios, cada uno vea también el carné del otro en su portal.
          </p>
        </div>
        <Link
          href="/admin/familias/nuevo"
          className="rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600"
        >
          + Nuevo/a jugador/a
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/familias">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por jugador/a o padre/madre…"
          className="w-72 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/20"
        />
        <select
          name="equipo"
          defaultValue={equipoFiltro}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/20"
        >
          <option value="">Todos los equipos</option>
          {equipos.map((eq) => (
            <option key={eq} value={eq}>{eq}</option>
          ))}
        </select>
        <button className="rounded-lg bg-azul px-4 py-2 text-sm font-semibold text-white">Buscar</button>
      </form>

      {error ? (
        <p className="rounded-xl border border-rojo/30 bg-rojo-50 p-4 text-sm text-rojo">
          No se pudo cargar la lista.
        </p>
      ) : jugadores.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          No hay jugadores/as{q || equipoFiltro ? " con esos criterios" : " todavía"}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Jugador/a</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Madre</th>
                <th className="px-4 py-3">Padre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {jugadores.map((j) => (
                <tr key={j.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/familias/${j.id}`} className="font-semibold text-azul-700 hover:underline">
                      {j.nombre} {j.apellidos}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{j.equipo || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {j.madre ? (
                      <Link href={`/admin/socios/${j.madre.id}`} className="text-azul hover:underline">
                        {j.madre.nombre} {j.madre.apellidos}
                      </Link>
                    ) : (
                      <span className="text-amber-600">Sin enlazar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {j.padre ? (
                      <Link href={`/admin/socios/${j.padre.id}`} className="text-azul hover:underline">
                        {j.padre.nombre} {j.padre.apellidos}
                      </Link>
                    ) : (
                      <span className="text-amber-600">Sin enlazar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-neutral-400">{jugadores.length} jugador(es)</p>
    </div>
  );
}
