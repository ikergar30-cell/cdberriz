import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio } from "@/lib/supabase/types";

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
  estado: EstadoSocio;
  tipos_abono: { nombre: string } | null;
};

export default async function SociosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const estado = searchParams.estado ?? "";

  const supabase = createClient();
  let query = supabase
    .from("socios")
    .select("id, numero_socio, nombre, apellidos, email, telefono, estado, tipos_abono(nombre)")
    .order("numero_socio");

  if (estado) query = query.eq("estado", estado);
  if (q) query = query.or(`nombre.ilike.%${q}%,apellidos.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  const socios = (data as unknown as SocioFila[]) ?? [];

  // Conserva el filtro de estado en el enlace de exportar.
  const exportHref = `/admin/socios/export${estado ? `?estado=${estado}` : ""}`;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
          Socios
        </h1>
        <div className="flex items-center gap-2">
          <a
            href={exportHref}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            Exportar CSV
          </a>
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

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const activo = estado === f.valor;
          const href = f.valor ? `/admin/socios?estado=${f.valor}` : "/admin/socios";
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                activo ? "bg-azul text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
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
                <th className="px-4 py-3">Cuota</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {socios.map((s) => (
                <tr key={s.id} className="transition hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-400">{s.numero_socio}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/socios/${s.id}`} className="font-semibold text-azul-700 hover:underline">
                      {s.nombre} {s.apellidos}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{s.tipos_abono?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.email ?? s.telefono ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[s.estado]}`}>
                      {s.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-neutral-400">{socios.length} socio(s)</p>
    </div>
  );
}
