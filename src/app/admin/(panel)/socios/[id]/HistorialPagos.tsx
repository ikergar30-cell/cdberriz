import type { EstadoPago } from "@/lib/supabase/types";
import type { FilaFactura } from "./page";

const BADGE: Record<EstadoPago, string> = {
  pagado: "bg-green-100 text-green-700",
  pendiente: "bg-amber-100 text-amber-700",
  fallido: "bg-rojo-50 text-rojo",
  reembolsado: "bg-neutral-100 text-neutral-500",
};

const ETIQUETA: Record<EstadoPago, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  fallido: "Fallido",
  reembolsado: "Reembolsado",
};

function formatearImporte(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatearFecha(fecha: number) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

// Todas las facturas del socio en Stripe (no solo lo que hayamos sincronizado
// en la tabla local): así se ve siempre el histórico completo de pagos.
export function HistorialPagos({
  facturas,
  tieneStripe,
}: {
  facturas: FilaFactura[];
  tieneStripe: boolean;
}) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Pagos y facturas
      </h2>

      {!tieneStripe ? (
        <p className="mt-3 text-sm text-neutral-500">
          Este socio no tiene pagos por Stripe (método de pago manual / fuera de Stripe).
        </p>
      ) : facturas.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          Todavía no hay facturas registradas en Stripe para este socio.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Temporada</th>
                <th className="px-4 py-3">Importe</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {facturas.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 text-neutral-700">{formatearFecha(f.fecha)}</td>
                  <td className="px-4 py-3 text-neutral-700">{f.temporada ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {formatearImporte(f.importe_cents)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{f.metodo ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[f.estado]}`}>
                      {ETIQUETA[f.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {f.hostedUrl && (
                      <a
                        href={f.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-azul hover:underline"
                      >
                        Ver
                      </a>
                    )}
                    {f.hostedUrl && f.pdfUrl && <span className="mx-1.5 text-neutral-300">·</span>}
                    {f.pdfUrl && (
                      <a
                        href={f.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-azul hover:underline"
                      >
                        PDF
                      </a>
                    )}
                    {!f.hostedUrl && !f.pdfUrl && <span className="text-neutral-400">—</span>}
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
