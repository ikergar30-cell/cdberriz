import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { NoticiaCard } from "@/components/sections/NoticiaCard";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { todasNoticiasQuery } from "@/sanity/lib/queries";
import type { Noticia } from "@/sanity/lib/types";
import { CATEGORIAS, CATEGORIA_KEY } from "@/lib/categorias";

export default async function NoticiasPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { cat?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("noticias");

  const todas = await sanityFetch<Noticia[]>(todasNoticiasQuery, {}, []);
  const cat = searchParams.cat;
  const noticias = cat ? todas.filter((n) => n.categoria === cat) : todas;

  return (
    <>
      <PageHeader title={t("title")} intro={t("intro")} />
      <div className="container py-10 md:py-12">
        <div className="mb-8 flex flex-wrap gap-2">
          <Chip href="/noticias" active={!cat}>
            {t("todas")}
          </Chip>
          {CATEGORIAS.map((c) => (
            <Chip key={c} href={`/noticias?cat=${c}`} active={cat === c}>
              {t(`categorias.${CATEGORIA_KEY[c]}`)}
            </Chip>
          ))}
        </div>

        {noticias.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {noticias.map((n) => (
              <NoticiaCard key={n._id} noticia={n} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
            {t("vacio")}
          </p>
        )}
      </div>
    </>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-azul text-white"
          : "border border-neutral-300 text-neutral-600 hover:border-azul hover:text-azul"
      }`}
    >
      {children}
    </Link>
  );
}
