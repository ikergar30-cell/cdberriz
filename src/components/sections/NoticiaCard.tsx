import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Noticia } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { urlForImage } from "@/sanity/image";
import { CATEGORIA_KEY } from "@/lib/categorias";

export async function NoticiaCard({
  noticia,
  locale,
}: {
  noticia: Noticia;
  locale: string;
}) {
  const t = await getTranslations("noticias");
  const img = noticia.portada
    ? urlForImage(noticia.portada).width(640).height(420).fit("crop").url()
    : null;
  const fecha = new Date(noticia.fecha).toLocaleDateString(
    locale === "eu" ? "eu" : "es-ES",
    { day: "numeric", month: "long", year: "numeric" },
  );
  const catLabel = t(`categorias.${CATEGORIA_KEY[noticia.categoria] ?? "club"}`);

  return (
    <Link
      href={`/noticias/${noticia.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-neutral-100">
        {img ? (
          <Image
            src={img}
            alt={noticia.portada?.alt ?? ""}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">
            <span className="font-display text-4xl font-extrabold">C.D.B.</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-rojo px-2.5 py-1 text-xs font-bold uppercase text-white">
          {catLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold leading-snug text-neutral-900 transition group-hover:text-azul">
          {pickLocale(noticia.titulo, locale)}
        </h3>
        <p className="mt-2 text-sm text-neutral-500">{fecha}</p>
      </div>
    </Link>
  );
}
