import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { temporadaActual, limitesTemporada } from "@/lib/temporada";

interface FilaEntrada {
  socio_id: string;
  creado_en: string;
  socios: { nombre: string; apellidos: string; numero_socio: number } | null;
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AsistenciaPage() {
  const supabase = createClient();
  const { inicio, fin } = limitesTemporada();

  const { data } = await supabase
    .from("entradas")
    .select("socio_id, creado_en, socios(nombre, apellidos, numero_socio)")
    .gte("creado_en", inicio.toISOString())
    .lt("creado_en", fin.toISOString())
    .order("creado_en", { ascending: false });

  const entradas = (data as unknown as FilaEntrada[]) ?? [];

  // Nº de "días de partido" distintos: cada fecha de calendario con al
  // menos una entrada registrada.
  const diasPartido = new Set(entradas.map((e) => new Date(e.creado_en).toDateString()));

  // Ranking por socio: nº de entradas y fecha de la última.
  const porSocio = new Map<
    string,
    { nombre: string; apellidos: string; numero_socio: number; total: number; ultima: string }
  >();
  for (const e of entradas) {
    if (!e.socios) continue;
    const actual = porSocio.get(e.socio_id);
    if (actual) {
      actual.total += 1;
    } else {
      porSocio.set(e.socio_id, {
        nombre: e.socios.nombre,
        apellidos: e.socios.apellidos,
        numero_socio: e.socios.numero_socio,
        total: 1,
        ultima: e.creado_en,
      });
    }
  }
  const ranking = Array.from(porSocio.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-[28px] font-extrabold uppercase leading-none tracking-tight text-azul-900 md:text-[32px]">
        Asistencia a partidos
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">
        Temporada {temporadaActual()}, a partir de las entradas registradas al verificar el carné en
        la puerta.
      </p>

      {/* Cifras rápidas */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-neutral-400">Entradas totales</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-azul-700">{entradas.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-neutral-400">Socios que han venido</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-azul-700">{ranking.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-neutral-400">Días de partido con público</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-azul-700">{diasPartido.size}</p>
        </div>
      </div>

      {/* Ranking de asistencia */}
      <h2 className="mt-10 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Ranking de asistencia
      </h2>
      {ranking.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          Todavía no hay entradas registradas esta temporada.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Entradas</th>
                <th className="px-4 py-3">Última vez</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {ranking.map((r, i) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/socios/${r.id}`} className="font-semibold text-azul-700 hover:underline">
                      {r.nombre} {r.apellidos}
                    </Link>
                    <p className="text-xs text-neutral-400">Nº {r.numero_socio}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-800">{r.total}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatearFecha(r.ultima)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
