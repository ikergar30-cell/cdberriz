import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Socio } from "@/lib/supabase/types";
import { BotonListo } from "./BotonListo";
import { BotonRechazar } from "./BotonRechazar";
import { CabeceraPagina, CuerpoPagina } from "../../ui";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

type Fila = Pick<
  Socio,
  | "id"
  | "numero_socio"
  | "nombre"
  | "apellidos"
  | "email"
  | "direccion"
  | "foto_url"
  | "carnet_fisico_pedido_en"
  | "carnet_fisico_entregado_en"
>;

export default async function CarnetsFisicosPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("socios")
    .select("id, numero_socio, nombre, apellidos, email, direccion, foto_url, carnet_fisico_pedido_en, carnet_fisico_entregado_en")
    .not("carnet_fisico_pedido_en", "is", null)
    .order("carnet_fisico_pedido_en", { ascending: true });

  const solicitudes = (data as Fila[]) ?? [];
  const pendientes = solicitudes.filter((s) => !s.carnet_fisico_entregado_en);
  const listos = solicitudes.filter((s) => s.carnet_fisico_entregado_en);

  return (
    <>
      <CabeceraPagina
        titulo="Carnés físicos"
        descripcion="Socios que han solicitado el carné físico desde su portal. Cuando lo tengas preparado, márcalo como listo — se avisa al socio por email para que pase a recogerlo por Berrizburu."
      />
      <CuerpoPagina>
      {/* Pendientes de entregar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
          Pendientes de entregar
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            {pendientes.length}
          </span>
        </h2>
        {pendientes.length > 0 && (
          <a
            href="/api/admin/carnets-pdf"
            className="rounded-full bg-azul px-4 py-2 text-sm font-semibold text-white transition hover:bg-azul-700"
          >
            Descargar PDF para imprenta ({pendientes.length})
          </a>
        )}
      </div>
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
                    {!s.foto_url && (
                      <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Sin foto — no se puede imprimir
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{s.direccion ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {s.carnet_fisico_pedido_en ? formatearFecha(s.carnet_fisico_pedido_en) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {s.foto_url ? (
                        <>
                          <a
                            href={`/api/admin/carnets-pdf?id=${s.id}`}
                            className="text-xs font-semibold text-azul hover:underline"
                          >
                            PDF
                          </a>
                          <BotonListo id={s.id} />
                        </>
                      ) : (
                        <BotonRechazar id={s.id} nombre={`${s.nombre} ${s.apellidos}`} />
                      )}
                    </div>
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
      </CuerpoPagina>
    </>
  );
}
