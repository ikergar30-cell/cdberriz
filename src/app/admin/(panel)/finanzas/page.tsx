import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { CabeceraPagina, CuerpoPagina } from "../ui";

// Informe financiero de Stripe — SOLO admin (directiva). Lee las transacciones
// de saldo del año elegido: bruto cobrado, comisiones de Stripe, neto real,
// desglose mensual y reembolsos/disputas.
export const dynamic = "force-dynamic";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ANO_INICIO = 2025; // primer año con Stripe activo en el club

function eur(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

type Resumen = {
  brutoCents: number;
  comisionesCents: number;
  netoCents: number;
  reembolsosCents: number;
  disputasCents: number;
  meses: { brutoCents: number; comisionesCents: number; netoCents: number }[];
  operaciones: number;
};

async function resumenDelAno(ano: number): Promise<Resumen> {
  const desde = Math.floor(Date.UTC(ano, 0, 1) / 1000);
  const hasta = Math.floor(Date.UTC(ano + 1, 0, 1) / 1000) - 1;

  const r: Resumen = {
    brutoCents: 0,
    comisionesCents: 0,
    netoCents: 0,
    reembolsosCents: 0,
    disputasCents: 0,
    meses: Array.from({ length: 12 }, () => ({ brutoCents: 0, comisionesCents: 0, netoCents: 0 })),
    operaciones: 0,
  };

  // Recorre todas las transacciones de saldo del año (paginación automática).
  for await (const tx of stripe.balanceTransactions.list({
    created: { gte: desde, lte: hasta },
    limit: 100,
  })) {
    const mes = new Date(tx.created * 1000).getUTCMonth();
    r.operaciones++;

    if (tx.type === "charge" || tx.type === "payment") {
      r.brutoCents += tx.amount;
      r.meses[mes].brutoCents += tx.amount;
    } else if (tx.type === "refund" || tx.type === "payment_refund") {
      r.reembolsosCents += Math.abs(tx.amount);
    } else if (tx.type === "adjustment") {
      // Disputas/chargebacks aparecen como ajustes (importe negativo).
      r.disputasCents += Math.abs(tx.amount);
    }

    // Comisiones y neto: sobre todas las operaciones (los reembolsos
    // devuelven parte de la comisión; el neto de Stripe ya lo refleja).
    r.comisionesCents += tx.fee;
    r.netoCents += tx.net;
    r.meses[mes].comisionesCents += tx.fee;
    r.meses[mes].netoCents += tx.net;
  }

  return r;
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: { ano?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (perfil?.rol !== "admin") redirect("/admin");

  const anoActual = new Date().getFullYear();
  const anoPedido = Number(searchParams.ano);
  const ano =
    Number.isInteger(anoPedido) && anoPedido >= ANO_INICIO && anoPedido <= anoActual
      ? anoPedido
      : anoActual;

  let resumen: Resumen | null = null;
  let errorStripe = false;
  try {
    resumen = await resumenDelAno(ano);
  } catch {
    errorStripe = true;
  }

  const anos = Array.from({ length: anoActual - ANO_INICIO + 1 }, (_, i) => ANO_INICIO + i);

  const tarjetas = resumen
    ? [
        { titulo: "Cobrado (bruto)", valor: eur(resumen.brutoCents), color: "text-azul-700" },
        { titulo: "Comisiones Stripe", valor: `−${eur(resumen.comisionesCents)}`, color: "text-rojo" },
        { titulo: "Neto real", valor: eur(resumen.netoCents), color: "text-green-700" },
        { titulo: "Reembolsos", valor: eur(resumen.reembolsosCents), color: "text-neutral-600" },
        { titulo: "Disputas", valor: eur(resumen.disputasCents), color: "text-neutral-600" },
        { titulo: "Operaciones", valor: String(resumen.operaciones), color: "text-neutral-600" },
      ]
    : [];

  return (
    <>
      <CabeceraPagina
        titulo="Informe financiero · Stripe"
        descripcion="Cobros de cuotas de socios a través de Stripe. Solo visible para administradores."
      />
      <CuerpoPagina>
      {/* Selector de año */}
      <div className="flex flex-wrap gap-2">
        {anos.map((a) => (
          <Link
            key={a}
            href={`/admin/finanzas?ano=${a}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              a === ano
                ? "bg-azul text-white"
                : "border border-neutral-300 text-neutral-600 hover:border-azul hover:text-azul"
            }`}
          >
            {a}
          </Link>
        ))}
      </div>

      {errorStripe || !resumen ? (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          No se pudo consultar Stripe. Comprueba la conexión y vuelve a intentarlo.
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tarjetas.map((t) => (
              <div key={t.titulo} className="rounded-xl border border-neutral-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {t.titulo}
                </p>
                <p className={`mt-2 font-display text-2xl font-extrabold ${t.color}`}>{t.valor}</p>
              </div>
            ))}
          </div>

          {/* Desglose mensual */}
          <h2 className="mt-10 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
            Desglose mensual {ano}
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Mes</th>
                  <th className="px-4 py-3 text-right">Bruto</th>
                  <th className="px-4 py-3 text-right">Comisiones</th>
                  <th className="px-4 py-3 text-right">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {resumen.meses.map((m, i) => (
                  <tr key={i} className={m.brutoCents === 0 && m.netoCents === 0 ? "text-neutral-400" : ""}>
                    <td className="px-4 py-2.5 font-semibold">{MESES[i]}</td>
                    <td className="px-4 py-2.5 text-right">{eur(m.brutoCents)}</td>
                    <td className="px-4 py-2.5 text-right">−{eur(m.comisionesCents)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{eur(m.netoCents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-neutral-200 bg-neutral-50 font-bold">
                <tr>
                  <td className="px-4 py-3">Total {ano}</td>
                  <td className="px-4 py-3 text-right">{eur(resumen.brutoCents)}</td>
                  <td className="px-4 py-3 text-right text-rojo">−{eur(resumen.comisionesCents)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{eur(resumen.netoCents)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
      </CuerpoPagina>
    </>
  );
}
