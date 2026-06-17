import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { sponsorsQuery } from "@/sanity/lib/queries";
import type { Sponsor } from "@/sanity/lib/types";
import { urlForImage } from "@/sanity/image";

export default async function PatrocinadoresPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";
  const tx = (es: string, e: string) => (eu ? e : es);

  const sponsors = await sanityFetch<Sponsor[]>(sponsorsQuery, {}, []);

  // Los "principales" se muestran más grandes y primero.
  const principales = sponsors.filter((s) => s.nivel === "principal");
  const resto = sponsors.filter((s) => s.nivel !== "principal");

  return (
    <>
      <PageHeader
        title={tx("Patrocinadores", "Babesleak")}
        intro={tx(
          "Empresas y entidades que hacen posible el C.D. Berriz. ¡Gracias por vuestro apoyo!",
          "C.D. Berriz posible egiten duten enpresak eta erakundeak. Eskerrik asko zuen babesagatik!",
        )}
      />

      <div className="container space-y-14 py-12 md:py-16">
        {sponsors.length > 0 ? (
          <>
            {principales.length > 0 && (
              <section>
                <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
                  {tx("Patrocinadores principales", "Babesle nagusiak")}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {principales.map((s) => (
                    <SponsorCard key={s._id} sponsor={s} grande />
                  ))}
                </div>
              </section>
            )}

            {resto.length > 0 && (
              <section>
                {principales.length > 0 && (
                  <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
                    {tx("Colaboradores", "Laguntzaileak")}
                  </h2>
                )}
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {resto.map((s) => (
                    <SponsorCard key={s._id} sponsor={s} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
            {tx(
              "Pronto presentaremos a los patrocinadores del club.",
              "Laster aurkeztuko ditugu klubaren babesleak.",
            )}
          </p>
        )}

        {/* Hazte patrocinador */}
        <section className="rounded-3xl bg-azul-900 px-6 py-12 text-center text-white md:px-12">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
            {tx("¿Quieres patrocinar al club?", "Kluba babestu nahi duzu?")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-azul-100">
            {tx(
              "Asóciate al C.D. Berriz y forma parte de un proyecto deportivo con más de 50 años de historia y fuerte arraigo en el pueblo.",
              "Egin zaitez C.D. Berrizeko babesle eta izan zaitez 50 urtetik gorako historia eta herrian errotutako kirol-proiektu baten parte.",
            )}
          </p>
          <Link
            href="/contacto"
            className="mt-6 inline-flex rounded-full bg-rojo px-6 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600"
          >
            {tx("Hazte patrocinador", "Babesle egin")}
          </Link>
        </section>
      </div>
    </>
  );
}

function SponsorCard({ sponsor, grande }: { sponsor: Sponsor; grande?: boolean }) {
  const alto = grande ? "h-32" : "h-24";
  const inner = (
    <div
      className={`flex ${alto} w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white p-5 transition hover:shadow-md ${
        grande ? "border-dorado/60" : ""
      }`}
    >
      {sponsor.logo ? (
        <Image
          src={urlForImage(sponsor.logo).width(400).fit("max").url()}
          alt={sponsor.nombre}
          width={200}
          height={100}
          className="max-h-full w-auto object-contain"
        />
      ) : (
        <span className="font-display font-bold text-azul-700">{sponsor.nombre}</span>
      )}
    </div>
  );

  // Si tiene web, el logo enlaza a ella.
  return sponsor.url ? (
    <a href={sponsor.url} target="_blank" rel="noopener noreferrer" aria-label={sponsor.nombre}>
      {inner}
    </a>
  ) : (
    inner
  );
}
