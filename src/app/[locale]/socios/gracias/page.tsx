import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default function GraciasPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  return (
    <>
      <PageHeader title={eu ? "Eskerrik asko!" : "¡Gracias!"} />
      <div className="container max-w-xl py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>
        <p className="text-lg font-semibold text-neutral-800">
          {eu
            ? "Zure bazkidetza tramitatu da."
            : "Tu alta como socio/a se ha tramitado."}
        </p>
        <p className="mt-3 text-neutral-600">
          {eu
            ? "Stripe-tik ordainketaren baieztapena jasoko duzu emailez. Ongi etorri C.D. Berrizera!"
            : "Recibirás por email la confirmación del pago de Stripe. ¡Bienvenido/a al C.D. Berriz!"}
        </p>
        <Link
          href={`/${locale}`}
          className="mt-8 inline-block rounded-full bg-rojo px-6 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600"
        >
          {eu ? "Hasierara itzuli" : "Volver al inicio"}
        </Link>
      </div>
    </>
  );
}
