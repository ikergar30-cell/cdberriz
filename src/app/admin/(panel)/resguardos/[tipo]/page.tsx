import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PersonaPago } from "@/lib/supabase/types";
import { FormResguardos } from "./FormResguardos";
import { GestionPersonas } from "./GestionPersonas";
import { CabeceraPagina, CuerpoPagina } from "../../ui";
import { RESGUARDOS_DIAS_RETENCION, limiteRetencionResguardos } from "@/config/resguardos";

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "2026-06" → "junio 2026"; cualquier otro concepto (partido) se muestra tal cual.
function formatearConcepto(concepto: string) {
  const m = concepto.match(/^(\d{4})-(\d{2})$/);
  if (!m) return concepto;
  return `${MESES_ES[Number(m[2]) - 1]} ${m[1]}`;
}

type FilaHistorial = {
  id: string;
  importe_cents: number;
  concepto: string;
  fecha: string;
  personas_pago: { nombre: string; tipo: string } | null;
};

export default async function ResguardosPage({
  params: { tipo },
}: {
  params: { tipo: string };
}) {
  if (tipo !== "arbitros" && tipo !== "entrenadores") notFound();
  const tipoPersona = tipo === "arbitros" ? "arbitro" : "entrenador";
  const esArbitros = tipoPersona === "arbitro";

  const supabase = createClient();
  const [{ data: personas }, { data: historial }] = await Promise.all([
    supabase
      .from("personas_pago")
      .select("*")
      .eq("tipo", tipoPersona)
      .order("nombre"),
    // Solo los de los últimos 90 días: pasado ese plazo se borran solos
    // (ver src/config/resguardos.ts) y no deben seguir apareciendo aquí.
    supabase
      .from("resguardos")
      .select("id, importe_cents, concepto, fecha, personas_pago!inner(nombre, tipo)")
      .eq("personas_pago.tipo", tipoPersona)
      .gte("created_at", limiteRetencionResguardos().toISOString())
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return (
    <>
      <CabeceraPagina
        titulo={`Resguardos · ${esArbitros ? "Árbitros" : "Entrenadores"}`}
        descripcion={
          esArbitros
            ? "Genera el recibo de pago del arbitraje de cada partido. Añade varias filas para descargar todos los PDFs de la jornada en un ZIP."
            : "Genera el recibo mensual de dietas de cada entrenador. Añade una fila por entrenador y descarga todos los PDFs del mes en un ZIP."
        }
      />
      <CuerpoPagina>
      <div>
        <FormResguardos
          tipo={tipoPersona}
          personas={(personas as PersonaPago[]) ?? []}
        />
      </div>

      <div className="mt-6">
        <GestionPersonas tipo={tipoPersona} personas={(personas as PersonaPago[]) ?? []} />
      </div>

      <h2 className="mt-10 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Últimos resguardos generados
      </h2>
      <p className="mt-1 text-xs text-neutral-400">
        Se guardan {RESGUARDOS_DIAS_RETENCION} días y después se borran solos: llevan nombre, DNI e
        importe, y no hace falta conservarlos más tiempo.
      </p>
      {!historial || historial.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Todavía no hay resguardos.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">{esArbitros ? "Partido" : "Mes"}</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Importe</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(historial as unknown as FilaHistorial[]).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-neutral-800">
                    {r.personas_pago?.nombre}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatearConcepto(r.concepto)}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(r.fecha).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {(r.importe_cents / 100).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/api/admin/resguardos?id=${r.id}`}
                      className="font-semibold text-azul hover:underline"
                    >
                      Descargar PDF
                    </a>
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
