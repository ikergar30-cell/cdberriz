import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { juntaDirectivaQuery } from "@/sanity/lib/queries";
import type { MiembroJunta } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { urlForImage } from "@/sanity/image";
import { club } from "@/config/club";

export default async function InformacionPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("club");

  const junta = await sanityFetch<{ miembros?: MiembroJunta[] } | null>(
    juntaDirectivaQuery,
    {},
    null,
  );
  const miembros = junta?.miembros ?? [];

  const datos = [
    { label: locale === "eu" ? "Izena" : "Nombre", value: club.nombre },
    {
      label: locale === "eu" ? "Sorrera" : "Fundación",
      value: String(club.fundacion),
    },
    {
      label: locale === "eu" ? "Helbidea" : "Dirección",
      value: club.direccion,
    },
    { label: "Email", value: club.email },
  ];

  return (
    <>
      <PageHeader title={t("infoTitle")} />
      <div className="container space-y-14 py-12">
        <section>
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
            {t("datosTitle")}
          </h2>
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
            {datos.map((d) => (
              <div key={d.label} className="bg-white p-5">
                <dt className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                  {d.label}
                </dt>
                <dd className="mt-1 font-semibold text-neutral-800">{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
            {t("juntaTitle")}
          </h2>
          {miembros.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {miembros.map((m, i) => {
                const foto = m.foto
                  ? urlForImage(m.foto).width(300).height(300).fit("crop").url()
                  : null;
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 text-center"
                  >
                    <div className="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-full bg-azul-50">
                      {foto ? (
                        <Image
                          src={foto}
                          alt={m.nombre}
                          width={96}
                          height={96}
                          className="h-24 w-24 object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center font-display text-2xl font-bold text-azul-300">
                          {m.nombre.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-neutral-900">{m.nombre}</p>
                    <p className="text-sm text-neutral-500">
                      {pickLocale(m.cargo, locale)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
              {locale === "eu"
                ? "Laster eguneratuko da Zuzendaritza Batzordearen informazioa."
                : "Próximamente se publicará la información de la Junta Directiva."}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
