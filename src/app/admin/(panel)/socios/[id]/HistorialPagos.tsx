import type { EstadoPago, Pago } from "@/lib/supabase/types";

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

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function HistorialPagos({ pagos }: { pagos: Pago[] }) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Historial de pagos
      </h2>

      {pagos.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Este socio todavía no tiene pagos registrados.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
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
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-neutral-700">{formatearFecha(p.fecha)}</td>
                  <td className="px-4 py-3 text-neutral-700">{p.temporada ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {formatearImporte(p.importe_cents)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{p.metodo ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[p.estado]}`}>
                      {ETIQUETA[p.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.stripe_hosted_invoice_url ? (
                      <a
                        href={p.stripe_hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-azul hover:underline"
                      >
                        Ver factura
                      </a>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
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
