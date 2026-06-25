import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { Link } from "@/i18n/routing";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { noticiaPorSlugQuery } from "@/sanity/lib/queries";
import type { Noticia } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { urlForImage } from "@/sanity/image";
import { CATEGORIA_KEY } from "@/lib/categorias";

type PortableBlock = Parameters<typeof PortableText>[0]["value"];

// Extrae el ID de un vídeo de YouTube de cualquier formato de enlace
// (watch?v=…, youtu.be/…, embed/…, shorts/…).
function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

// Renderizado del cuerpo: las imágenes del artículo se muestran enteras,
// con su proporción original (sin recortar); los vídeos de YouTube se
// incrustan en un reproductor responsivo 16:9.
const ptComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: SanityImageSource & { alt?: string } }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={urlForImage(value).width(1200).url()}
        alt={value.alt ?? ""}
        className="my-6 w-full rounded-xl"
      />
    ),
    youtube: ({ value }: { value: { url?: string } }) => {
      const id = youtubeId(value.url);
      if (!id) return null;
      return (
        <div className="my-6 aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Vídeo de YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    },
  },
};

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

  // Portada a tamaño generoso SIN recortar (conserva la proporción original).
  const img = noticia.portada
    ? urlForImage(noticia.portada).width(1600).url()
    : null;
  const fecha = new Date(noticia.fecha).toLocaleDateString(
    locale === "eu" ? "eu" : "es-ES",
    { day: "numeric", month: "long", year: "numeric" },
  );
  // Cuerpo en el idioma elegido; si no existe (p. ej. noticias migradas solo en
  // castellano), se muestra el artículo COMPLETO en el otro idioma como respaldo.
  const cuerpo = (noticia.cuerpo?.[locale === "eu" ? "eu" : "es"]?.length
    ? noticia.cuerpo[locale === "eu" ? "eu" : "es"]
    : (noticia.cuerpo?.es ?? noticia.cuerpo?.eu ?? [])) as PortableBlock;

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
        <Image
          src={img}
          alt={noticia.portada?.alt ?? pickLocale(noticia.titulo, locale)}
          width={noticia.portadaDims?.width ?? 1600}
          height={noticia.portadaDims?.height ?? 900}
          className="my-8 w-full rounded-2xl"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      )}

      <div className="space-y-4 leading-relaxed text-neutral-700">
        {Array.isArray(cuerpo) && cuerpo.length > 0 ? (
          <PortableText value={cuerpo} components={ptComponents} />
        ) : (
          <p>{pickLocale(noticia.extracto, locale)}</p>
        )}
      </div>
    </article>
  );
}
