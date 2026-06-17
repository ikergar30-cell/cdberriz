import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { documentosQuery } from "@/sanity/lib/queries";
import type { DocumentoDescargable } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";

const FAQ = [
  {
    p: { es: "¿Cómo apunto a mi hijo/a?", eu: "Nola izena eman dezaket nire seme-alaba?" },
    r: {
      es: "Escríbenos a través del formulario de contacto y te explicamos el proceso de inscripción.",
      eu: "Idatzi guri kontaktu-formularioaren bidez eta izen-emate prozesua azalduko dizugu.",
    },
  },
  {
    p: { es: "¿Qué incluye la cuota?", eu: "Zer barne hartzen du kuotak?" },
    r: {
      es: "Equipación, seguro federativo y participación en la liga durante toda la temporada.",
      eu: "Ekipamendua, federazio-asegurua eta ligan parte hartzea denboraldi osoan.",
    },
  },
];

export default async function FamiliasPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("familias");
  const tNot = await getTranslations("noticias");

  const documentos = await sanityFetch<DocumentoDescargable[]>(
    documentosQuery,
    {},
    [],
  );

  return (
    <>
      <PageHeader title={t("contactoTitle") /* título genérico de sección */} />
      <div className="container space-y-14 py-12">
        {/* Documentos descargables */}
        <section>
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
            {t("documentosTitle")}
          </h2>
          {documentos.length > 0 ? (
            <ul className="space-y-3">
              {documentos.map((d) => (
                <li key={d._id}>
                  <a
                    href={d.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-azul"
                  >
                    <span className="font-semibold text-neutral-800">
                      {pickLocale(d.titulo, locale)}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-azul">
                      ↓ {t("descargar")}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
              {locale === "eu"
                ? "Laster egongo dira dokumentuak eskuragarri."
                : "Próximamente habrá documentos disponibles."}
            </p>
          )}
        </section>

        {/* Noticias para familias */}
        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
            {t("noticiasTitle")}
          </h2>
          <Link
            href="/noticias?cat=cantera"
            className="font-semibold text-azul hover:underline"
          >
            {tNot("categorias.cantera")} →
          </Link>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
            {t("faqTitle")}
          </h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <summary className="cursor-pointer font-semibold text-azul-700">
                  {pickLocale(f.p, locale)}
                </summary>
                <p className="mt-2 text-neutral-600">{pickLocale(f.r, locale)}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contacto */}
        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
            {t("contactoTitle")}
          </h2>
          <Link
            href="/contacto"
            className="inline-flex rounded-full bg-rojo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600"
          >
            {t("contactoTitle")} →
          </Link>
        </section>
      </div>
    </>
  );
}
