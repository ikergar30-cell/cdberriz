import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { CUOTAS, esClaveCuota } from "@/config/cuotas";
import { pickLocale } from "@/lib/locale";
import { AltaForm } from "./AltaForm";

export default function AltaPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { cuota?: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  const clave = searchParams.cuota ?? "";
  if (!esClaveCuota(clave)) notFound();
  const cuota = CUOTAS[clave];

  return (
    <>
      <PageHeader
        title={eu ? "Bazkide egin" : "Hazte socio/a"}
        intro={
          eu
            ? "Bete zure datuak eta ordaindu modu seguruan."
            : "Rellena tus datos y completa el pago de forma segura."
        }
      />
      <div className="container max-w-2xl py-12 md:py-16">
        {/* Cuota elegida */}
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-rojo bg-rojo-50 p-5">
          <div>
            <p className="font-display text-lg font-bold uppercase text-azul-700">
              {pickLocale(cuota.nombre, locale)}
            </p>
            <p className="text-sm text-neutral-600">
              {pickLocale(cuota.descripcion, locale)}
            </p>
          </div>
          <p className="text-right">
            <span className="font-display text-3xl font-extrabold text-rojo">
              {cuota.precio} €
            </span>
            <span className="block text-xs text-neutral-500">
              {eu ? "urteko / berritze automatikoa" : "al año · renovación automática"}
            </span>
          </p>
        </div>

        <AltaForm clave={clave} />
      </div>
    </>
  );
}
