import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio } from "@/lib/supabase/types";

// Cuenta socios por estado. RLS garantiza que solo un empleado ve estos datos.
async function contarPorEstado(estado: EstadoSocio) {
  const supabase = createClient();
  const { count } = await supabase
    .from("socios")
    .select("*", { count: "exact", head: true })
    .eq("estado", estado);
  return count ?? 0;
}

export default async function ResumenPage() {
  const [activos, pendientes, morosos, bajas] = await Promise.all([
    contarPorEstado("activo"),
    contarPorEstado("pendiente"),
    contarPorEstado("moroso"),
    contarPorEstado("baja"),
  ]);

  const tarjetas = [
    { label: "Socios activos", valor: activos, color: "text-green-600" },
    { label: "Pendientes", valor: pendientes, color: "text-amber-600" },
    { label: "Morosos", valor: morosos, color: "text-rojo" },
    { label: "Bajas", valor: bajas, color: "text-neutral-400" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
          Resumen
        </h1>
        <Link
          href="/admin/socios"
          className="rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600"
        >
          Gestionar socios
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-medium text-neutral-500">{t.label}</p>
            <p className={`mt-2 font-display text-4xl font-extrabold ${t.color}`}>
              {t.valor}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-neutral-500">
        Total de socios: <strong>{activos + pendientes + morosos + bajas}</strong>
      </p>
    </div>
  );
}
