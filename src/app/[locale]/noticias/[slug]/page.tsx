import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { Link } from "@/i18n/routing";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { noticiaPorSlugQuery } from "@/sanity/lib/queries";
import type { Noticia } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { urlForImage } from "@/sanity/image";
import { CATEGORIA_KEY } from "@/lib/categorias";

type PortableBlock = Parameters<typeof PortableText>[0]["value"];

export default async function NoticiaDetalle({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("noticias");

  const noticia = await sanityFetch<Noticia | null>(
    noticiaPorSlugQuery,
    { slug },
    null,
  );
  if (!noticia) notFound();

  const img = noticia.portada
    ? urlForImage(noticia.portada).width(1200).height(630).fit("crop").url()
    : null;
  const fecha = new Date(noticia.fecha).toLocaleDateString(
    locale === "eu" ? "eu" : "es-ES",
    { day: "numeric", month: "long", year: "numeric" },
  );
  const cuerpo = (noticia.cuerpo?.[locale === "eu" ? "eu" : "es"] ??
    []) as PortableBlock;

  return (
    <article className="container max-w-3xl py-10 md:py-14">
      <Link
        href="/noticias"
        className="text-sm font-semibold text-azul hover:underline"
      >
        ← {t("title")}
      </Link>
      <p className="mt-6 text-sm font-bold uppercase tracking-wide text-rojo">
        {t(`categorias.${CATEGORIA_KEY[noticia.categoria] ?? "club"}`)}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight md:text-4xl">
        {pickLocale(noticia.titulo, locale)}
      </h1>
      <p className="mt-2 text-neutral-500">{fecha}</p>

      {img && (
        <div className="relative my-8 aspect-[1200/630] overflow-hidden rounded-2xl">
          <Image
            src={img}
            alt={noticia.portada?.alt ?? ""}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-4 leading-relaxed text-neutral-700">
        {Array.isArray(cuerpo) && cuerpo.length > 0 ? (
          <PortableText value={cuerpo} />
        ) : (
          <p>{pickLocale(noticia.extracto, locale)}</p>
        )}
      </div>
    </article>
  );
}
