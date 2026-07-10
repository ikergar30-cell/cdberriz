import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Socio } from "@/lib/supabase/types";
import { BotonListo } from "./BotonListo";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

type Fila = Pick<
  Socio,
  "id" | "numero_socio" | "nombre" | "apellidos" | "email" | "direccion" | "carnet_fisico_pedido_en" | "carnet_fisico_entregado_en"
>;

export default async function CarnetsFisicosPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("socios")
    .select("id, numero_socio, nombre, apellidos, email, direccion, carnet_fisico_pedido_en, carnet_fisico_entregado_en")
    .not("carnet_fisico_pedido_en", "is", null)
    .order("carnet_fisico_pedido_en", { ascending: true });

  const solicitudes = (data as Fila[]) ?? [];
  const pendientes = solicitudes.filter((s) => !s.carnet_fisico_entregado_en);
  const listos = solicitudes.filter((s) => s.carnet_fisico_entregado_en);

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
        Carnés físicos
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">
        Socios que han solicitado el carné físico desde su portal. Cuando lo tengas preparado,
        márcalo como listo — se avisa al socio por email para que pase a recogerlo por Berrizburu.
      </p>

      {/* Pendientes de entregar */}
      <h2 className="mt-8 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Pendientes de entregar
        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
          {pendientes.length}
        </span>
      </h2>
      {pendientes.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No hay solicitudes pendientes.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Solicitado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {pendientes.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/socios/${s.id}`} className="font-semibold text-azul-700 hover:underline">
                      {s.nombre} {s.apellidos}
                    </Link>
                    <p className="text-xs text-neutral-400">Nº {s.numero_socio}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{s.direccion ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.carnet_fisico_pedido_en ? formatearFecha(s.carnet_fisico_pedido_en) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <BotonListo id={s.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ya listos / entregados */}
      <h2 className="mt-10 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Listos / entregados
      </h2>
      {listos.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Todavía no hay ninguno marcado como listo.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Solicitado</th>
                <th className="px-4 py-3">Listo desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {listos.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/socios/${s.id}`} className="font-semibold text-azul-700 hover:underline">
                      {s.nombre} {s.apellidos}
                    </Link>
                    <p className="text-xs text-neutral-400">Nº {s.numero_socio}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.carnet_fisico_pedido_en ? formatearFecha(s.carnet_fisico_pedido_en) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      {s.carnet_fisico_entregado_en ? formatearFecha(s.carnet_fisico_entregado_en) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
