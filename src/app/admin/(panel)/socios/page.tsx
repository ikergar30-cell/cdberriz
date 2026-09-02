import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio, OrigenSocio } from "@/lib/supabase/types";
import { camposFaltantes } from "@/lib/socios/camposFaltantes";
import { etiquetaTipoSocio } from "@/config/origenSocio";
import { normaliza } from "@/lib/texto";
import { SincronizarRenovaciones } from "./SincronizarRenovaciones";
import { SincronizarFechasAlta } from "./SincronizarFechasAlta";

const BADGE: Record<EstadoSocio, string> = {
  activo: "bg-green-100 text-green-700",
  pendiente: "bg-amber-100 text-amber-700",
  moroso: "bg-rojo-50 text-rojo",
  baja: "bg-neutral-100 text-neutral-500",
};

// "Activos" es la vista por defecto: los pendientes, morosos y bajas quedan
// fuera de la lista principal a propósito, para no mezclarlos con el día a
// día. Se accede a ellos con su propio filtro.
const FILTROS: { valor: string; label: string }[] = [
  { valor: "activo", label: "Activos" },
  { valor: "pendiente", label: "Pendientes" },
  { valor: "moroso", label: "Morosos" },
  { valor: "baja", label: "Bajas" },
  { valor: "todos", label: "Todos" },
];

type SocioFila = {
  id: string;
  numero_socio: number;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  dni: string | null;
  direccion: string | null;
  poblacion: string | null;
  codigo_postal: string | null;
  fecha_nacimiento: string | null;
  estado: EstadoSocio;
  origen: OrigenSocio;
  tipo_abono_id: string | null;
  titular_id: string | null;
  tipos_abono: { nombre: string } | null;
  titular: { numero_socio: number; nombre: string; apellidos: string } | null;
};

type JugadorFila = {
  id: string;
  nombre: string;
  apellidos: string | null;
  equipo: string | null;
  madre_socio_id: string | null;
  padre_socio_id: string | null;
};

function DatosBadge({ socio }: { socio: SocioFila }) {
  const faltan = camposFaltantes(socio);
  if (faltan.length === 0) return <span className="text-neutral-300">✓</span>;
  return (
    <span
      title={`Falta: ${faltan.join(", ")}`}
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
    >
      ⚠ {faltan.length}
    </span>
  );
}

export default async function SociosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string; incompletos?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  // Sin filtro explícito en la URL, se ve solo "Activos" (ver FILTROS).
  const estado = searchParams.estado ?? "activo";
  const soloIncompletos = searchParams.incompletos === "1";

  const supabase = createClient();
  let query = supabase
    .from("socios")
    .select(
      "id, numero_socio, nombre, apellidos, email, telefono, dni, direccion, poblacion, codigo_postal, fecha_nacimiento, estado, origen, tipo_abono_id, titular_id, tipos_abono(nombre), titular:titular_id(numero_socio, nombre, apellidos)",
    )
    .order("numero_socio");

  if (estado !== "todos") query = query.eq("estado", estado);

  const [{ data, error }, { data: jugadoresData }] = await Promise.all([
    query,
    supabase.from("jugadores").select("id, nombre, apellidos, equipo, madre_socio_id, padre_socio_id"),
  ]);
  let todos = (data as unknown as SocioFila[]) ?? [];
  const jugadores = (jugadoresData as JugadorFila[]) ?? [];

  // Búsqueda sin distinguir mayúsculas/tildes ("garcia" debe encontrar
  // "García"): Postgres/PostgREST no lo hace por defecto vía ilike, así que
  // se filtra aquí. La lista de socios no es tan grande como para que esto
  // sea un problema de rendimiento.
  if (q) {
    const buscado = normaliza(q);
    todos = todos.filter((s) =>
      normaliza(`${s.nombre} ${s.apellidos} ${s.email ?? ""}`).includes(buscado),
    );
  }
  const incompletosCount = todos.filter((s) => camposFaltantes(s).length > 0).length;
  const socios = soloIncompletos ? todos.filter((s) => camposFaltantes(s).length > 0) : todos;

  // Para que el titular también vea a quién le paga el 2º carné (no solo al
  // revés). Se calcula sobre "todos", no sobre el filtro activo, para no
  // perder el dato si la búsqueda oculta a uno de los dos.
  const dependientesPorTitular = new Map<string, SocioFila[]>();
  todos.forEach((s) => {
    if (!s.titular_id) return;
    const lista = dependientesPorTitular.get(s.titular_id) ?? [];
    lista.push(s);
    dependientesPorTitular.set(s.titular_id, lista);
  });

  // ── Socios "de cuota" (o mixtos con cuota): tabla normal, como siempre ──
  const sociosCuota = socios.filter((s) => s.origen !== "jugador");

  // ── Socios "por hijo/a jugando": agrupados bajo el paraguas de cada
  //    hijo/a en vez de sueltos — con 366 de 555 socios activos así, listarlos
  //    todos en plano era ilegible. Si un socio tiene más de un hijo/a en el
  //    club, aparece (a propósito) debajo de cada uno de ellos: no se
  //    duplica ningún dato, solo se repite en la vista.
  const sociosJugador = socios.filter((s) => s.origen === "jugador");
  const sociosJugadorIds = new Set(sociosJugador.map((s) => s.id));
  const sociosJugadorPorId = new Map(sociosJugador.map((s) => [s.id, s]));

  type GrupoFamilia = { jugador: JugadorFila | null; padres: SocioFila[] };
  const grupos: GrupoFamilia[] = [];
  const yaAgrupados = new Set<string>();

  for (const j of jugadores) {
    const padres = [j.madre_socio_id, j.padre_socio_id]
      .filter((pid): pid is string => Boolean(pid) && sociosJugadorIds.has(pid!))
      .map((pid) => sociosJugadorPorId.get(pid)!);
    if (padres.length === 0) continue;
    padres.forEach((p) => yaAgrupados.add(p.id));
    grupos.push({ jugador: j, padres });
  }
  grupos.sort((a, b) => (a.jugador?.nombre ?? "").localeCompare(b.jugador?.nombre ?? ""));

  // Socios "por hijo/a" sin ningún jugador/a vinculado esta temporada (su
  // hijo/a ya no juega, o falta enlazarlo en "Familias / Jugadores").
  const sinVincular = sociosJugador.filter((s) => !yaAgrupados.has(s.id));
  if (sinVincular.length > 0) {
    grupos.push({ jugador: null, padres: sinVincular });
  }

  // Conserva el filtro de estado en el enlace de exportar.
  const exportHref = `/admin/socios/export${estado ? `?estado=${estado}` : ""}`;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
          Socios
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <SincronizarRenovaciones />
          <SincronizarFechasAlta />
          <a
            href={exportHref}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            Exportar CSV
          </a>
          <Link
            href="/admin/socios/importar"
            className="rounded-full border border-azul px-4 py-2 text-sm font-semibold text-azul transition hover:bg-azul hover:text-white"
          >
            Importar CSV
          </Link>
          <Link
            href="/admin/socios/nuevo"
            className="rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600"
          >
            + Nuevo socio
          </Link>
        </div>
      </div>

      {/* Buscador + filtros */}
      <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/socios">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, apellidos o email…"
          className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/20"
        />
        {estado && <input type="hidden" name="estado" value={estado} />}
        <button className="rounded-lg bg-azul px-4 py-2 text-sm font-semibold text-white">
          Buscar
        </button>
      </form>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => {
          const activo = estado === f.valor;
          const params = new URLSearchParams();
          if (f.valor) params.set("estado", f.valor);
          if (soloIncompletos) params.set("incompletos", "1");
          const qs = params.toString();
          return (
            <Link
              key={f.label}
              href={`/admin/socios${qs ? `?${qs}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                activo ? "bg-azul text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f.label}
            </Link>
          );
        })}

        {incompletosCount > 0 && (
          <>
            <span className="mx-1 h-4 w-px bg-neutral-200" />
            {(() => {
              const params = new URLSearchParams();
              if (estado) params.set("estado", estado);
              if (!soloIncompletos) params.set("incompletos", "1");
              const qs = params.toString();
              return (
                <Link
                  href={`/admin/socios${qs ? `?${qs}` : ""}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    soloIncompletos
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  }`}
                >
                  ⚠ Datos incompletos ({incompletosCount})
                </Link>
              );
            })()}
          </>
        )}
      </div>

      {error ? (
        <p className="rounded-xl border border-rojo/30 bg-rojo-50 p-4 text-sm text-rojo">
          No se pudieron cargar los socios. Revisa la configuración de Supabase.
        </p>
      ) : socios.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          No hay socios{q || estado ? " con esos criterios" : " todavía"}.{" "}
          <Link href="/admin/socios/nuevo" className="font-semibold text-azul underline">
            Crea el primero
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-10">
          {/* ── Socios de cuota ── */}
          {sociosCuota.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
                Socios de cuota ({sociosCuota.length})
              </h2>
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Nº</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Cuota</th>
                      <th className="px-4 py-3">Contacto</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Datos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {sociosCuota.map((s) => {
                      const tipo = etiquetaTipoSocio(s.origen, Boolean(s.tipo_abono_id));
                      return (
                        <tr
                          key={s.id}
                          className={`transition hover:bg-neutral-50 ${
                            s.titular_id ? "border-l-2 border-azul-200" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-neutral-400">{s.numero_socio}</td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/socios/${s.id}`} className="font-semibold text-azul-700 hover:underline">
                              {s.nombre} {s.apellidos}
                            </Link>
                            {s.titular_id && (
                              <div className="text-xs text-neutral-400">
                                ↳ bono familiar de{" "}
                                {s.titular ? (
                                  <Link href={`/admin/socios/${s.titular_id}`} className="text-azul-600 hover:underline">
                                    {s.titular.nombre} {s.titular.apellidos} (nº {s.titular.numero_socio})
                                  </Link>
                                ) : (
                                  "—"
                                )}
                              </div>
                            )}
                            {!s.titular_id && dependientesPorTitular.has(s.id) && (
                              <div className="text-xs text-neutral-400">
                                ↳ 2º carné:{" "}
                                {dependientesPorTitular.get(s.id)!.map((d, i) => (
                                  <span key={d.id}>
                                    {i > 0 && ", "}
                                    <Link href={`/admin/socios/${d.id}`} className="text-azul-600 hover:underline">
                                      {d.nombre} {d.apellidos} (nº {d.numero_socio})
                                    </Link>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tipo.badge}`}>
                              {tipo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {s.tipos_abono?.nombre ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {s.email ?? s.telefono ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[s.estado]}`}>
                              {s.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <DatosBadge socio={s} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Por hijo/a jugando, agrupados bajo su hijo/a ── */}
          {grupos.length > 0 && (
            <div>
              <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
                Por hijo/a jugando ({sociosJugador.length})
              </h2>
              <p className="mb-3 text-xs text-neutral-400">
                Agrupados por el hijo/a que juega. Si un socio tiene más de uno, sale debajo de
                cada uno (es la misma persona, solo se repite la vista).
              </p>
              <div className="space-y-3">
                {grupos.map((g) => (
                  <div key={g.jugador?.id ?? "sin-vincular"} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5">
                      {g.jugador ? (
                        <p className="text-sm font-semibold text-neutral-800">
                          ⚽ {g.jugador.nombre} {g.jugador.apellidos ?? ""}
                          {g.jugador.equipo && (
                            <span className="ml-2 font-normal text-neutral-400">{g.jugador.equipo}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-amber-700">
                          Sin hijo/a vinculado esta temporada
                        </p>
                      )}
                      {g.jugador && (
                        <Link
                          href={`/admin/familias/${g.jugador.id}`}
                          className="text-xs font-semibold text-azul hover:underline"
                        >
                          Editar vínculo
                        </Link>
                      )}
                    </div>
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-neutral-100">
                        {g.padres.map((s) => {
                          const tipo = etiquetaTipoSocio(s.origen, Boolean(s.tipo_abono_id));
                          return (
                            <tr key={s.id} className="transition hover:bg-neutral-50">
                              <td className="w-14 px-4 py-2.5 text-neutral-400">{s.numero_socio}</td>
                              <td className="px-4 py-2.5">
                                <Link href={`/admin/socios/${s.id}`} className="font-semibold text-azul-700 hover:underline">
                                  {s.nombre} {s.apellidos}
                                </Link>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tipo.badge}`}>
                                  {tipo.label}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-neutral-600">{s.email ?? s.telefono ?? "—"}</td>
                              <td className="px-4 py-2.5">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[s.estado]}`}>
                                  {s.estado}
                                </span>
                              </td>
                              <td className="w-12 px-4 py-2.5">
                                <DatosBadge socio={s} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-sm text-neutral-400">{socios.length} socio(s)</p>
    </div>
  );
}
