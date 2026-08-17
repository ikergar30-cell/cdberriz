import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio, OrigenSocio } from "@/lib/supabase/types";
import { camposFaltantes } from "@/lib/socios/camposFaltantes";
import { etiquetaTipoSocio } from "@/config/origenSocio";
import { SincronizarRenovaciones } from "./SincronizarRenovaciones";
import { SincronizarFechasAlta } from "./SincronizarFechasAlta";

const BADGE: Record<EstadoSocio, string> = {
  activo: "bg-green-100 text-green-700",
  pendiente: "bg-amber-100 text-amber-700",
  moroso: "bg-rojo-50 text-rojo",
  baja: "bg-neutral-100 text-neutral-500",
};

const FILTROS: { valor: string; label: string }[] = [
  { valor: "", label: "Todos" },
  { valor: "activo", label: "Activos" },
  { valor: "pendiente", label: "Pendientes" },
  { valor: "moroso", label: "Morosos" },
  { valor: "baja", label: "Bajas" },
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
};

export default async function SociosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string; incompletos?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const estado = searchParams.estado ?? "";
  const soloIncompletos = searchParams.incompletos === "1";

  const supabase = createClient();
  let query = supabase
    .from("socios")
    .select(
      "id, numero_socio, nombre, apellidos, email, telefono, dni, direccion, poblacion, codigo_postal, fecha_nacimiento, estado, origen, tipo_abono_id, titular_id, tipos_abono(nombre)",
    )
    .order("numero_socio");

  if (estado) query = query.eq("estado", estado);
  if (q) query = query.or(`nombre.ilike.%${q}%,apellidos.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  const todos = (data as unknown as SocioFila[]) ?? [];
  const incompletosCount = todos.filter((s) => camposFaltantes(s).length > 0).length;
  const socios = soloIncompletos ? todos.filter((s) => camposFaltantes(s).length > 0) : todos;

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
              {socios.map((s) => {
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
                      <div className="text-xs text-neutral-400">↳ bono familiar</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tipo.badge}`}>
                      {tipo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.tipos_abono?.nombre ?? (s.origen === "jugador" ? "Hijo/a jugador/a" : "—")}
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
                    {(() => {
                      const faltan = camposFaltantes(s);
                      if (faltan.length === 0) return <span className="text-neutral-300">✓</span>;
                      return (
                        <span
                          title={`Falta: ${faltan.join(", ")}`}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
                        >
                          ⚠ {faltan.length}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-neutral-400">{socios.length} socio(s)</p>
    </div>
  );
}
