import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/sections/ContactForm";
import { club } from "@/config/club";

export default async function ContactoPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("contacto");

  return (
    <>
      <PageHeader title={t("title")} intro={t("intro")} />
      <div className="container grid gap-12 py-12 md:grid-cols-2 md:py-16">
        {/* Formulario */}
        <div>
          <ContactForm />
        </div>

        {/* Datos + sponsor */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-xl font-bold text-azul-700">
              C.D. Berriz
            </h2>
            <p className="mt-3 text-neutral-600">{club.direccion}</p>
            <p className="mt-1 text-neutral-600">{club.email}</p>
          </div>

          <div className="rounded-2xl border border-rojo-200 bg-rojo-50 p-6">
            <h2 className="font-display text-xl font-bold text-rojo">
              {t("sponsorTitle")}
            </h2>
            <p className="mt-3 text-neutral-700">{t("sponsorText")}</p>
          </div>
        </div>
      </div>
    </>
  );
}
