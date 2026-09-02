import { createClient } from "@/lib/supabase/server";
import type { TipoAbono } from "@/lib/supabase/types";
import { CabeceraPagina, CuerpoPagina } from "../ui";

export default async function CuotasPage() {
  const supabase = createClient();
  const { data } = await supabase.from("tipos_abono").select("*").order("orden");
  const tipos = (data as TipoAbono[]) ?? [];

  return (
    <>
      <CabeceraPagina
        titulo="Cuotas"
        descripcion="Precios de las cuotas de socio/a y su enlace con Stripe para el pago online."
      />
      <CuerpoPagina>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Cuota</th>
              <th className="px-4 py-3">Precio anual</th>
              <th className="px-4 py-3">Pago online</th>
              <th className="px-4 py-3">Activa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tipos.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-semibold text-neutral-800">{t.nombre}</td>
                <td className="px-4 py-3">{(t.precio_cents / 100).toFixed(2)} €</td>
                <td className="px-4 py-3">
                  {t.stripe_price_id ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      Conectado
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-500">
                      Sin conectar
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{t.activo ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-neutral-500">
        El pago online se activa en la Fase 2 (Stripe). Los precios se editan aquí y en Stripe.
      </p>
      </CuerpoPagina>
    </>
  );
}
