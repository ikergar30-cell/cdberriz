import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { NoticiaCard } from "@/components/sections/NoticiaCard";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import {
  noticiasRecientesQuery,
  eventosProximosQuery,
  paginaInicioQuery,
} from "@/sanity/lib/queries";
import type { Noticia, Evento, PaginaInicio } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { urlForImage } from "@/sanity/image";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tNot = await getTranslations("noticias");

  const [inicio, noticias, eventos] = await Promise.all([
    sanityFetch<PaginaInicio | null>(paginaInicioQuery, {}, null),
    sanityFetch<Noticia[]>(noticiasRecientesQuery, {}, []),
    sanityFetch<Evento[]>(eventosProximosQuery, {}, []),
  ]);

  const heroImg = inicio?.heroImagen
    ? urlForImage(inicio.heroImagen).width(1920).height(900).fit("crop").url()
    : null;
  const heroTitulo = pickLocale(inicio?.heroTitulo, locale) || "C.D. Berriz";
  const heroSubtitulo =
    pickLocale(inicio?.heroSubtitulo, locale) || t("heroTagline");

  const cards = [
    { title: t("card1Title"), text: t("card1Text"), href: "/equipos", variant: "primary" as const },
    { title: t("card2Title"), text: t("card2Text"), href: "/equipos", variant: "secondary" as const },
    { title: t("card3Title"), text: t("card3Text"), href: "/socios", variant: "primary" as const },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-azul-800 via-azul-700 to-rojo-700" />
        {heroImg && (
          <Image
            src={heroImg}
            alt=""
            fill
            priority
            className="absolute inset-0 -z-10 object-cover opacity-25"
          />
        )}
        <div className="container flex flex-col items-center gap-6 py-24 text-center text-white md:py-32">
          <Image
            src="/escudo-blanco.png"
            alt=""
            width={112}
            height={112}
            className="h-24 w-24 object-contain drop-shadow-lg md:h-28 md:w-28"
            priority
          />
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight drop-shadow md:text-6xl">
            {heroTitulo}
          </h1>
          <p className="max-w-2xl text-lg font-semibold text-dorado md:text-xl">
            {heroSubtitulo}
          </p>
          <LinkButton href="/socios" variant="light" className="mt-2">
            {t("heroCta")}
          </LinkButton>
        </div>
      </section>

      {/* 3 TARJETAS */}
      <section className="container relative z-10 -mt-14 grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex flex-col rounded-2xl border border-neutral-100 bg-white p-6 shadow-xl"
          >
            <h2 className="font-display text-xl font-bold text-azul-700">
              {c.title}
            </h2>
            <p className="mt-2 flex-1 text-neutral-600">{c.text}</p>
            <div className="mt-5">
              <LinkButton href={c.href} variant={c.variant}>
                {t("cardCta")}
              </LinkButton>
            </div>
          </div>
        ))}
      </section>

      {/* NOTICIAS RECIENTES */}
      <section className="container py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
            {t("noticiasTitle")}
          </h2>
          <LinkButton href="/noticias" variant="outline" className="shrink-0">
            {t("noticiasCta")}
          </LinkButton>
        </div>
        {noticias.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {noticias.map((n) => (
              <NoticiaCard key={n._id} noticia={n} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
            {tNot("vacio")}
          </p>
        )}
      </section>

      {/* PRÓXIMOS EVENTOS */}
      <section className="bg-neutral-50 py-16 md:py-20">
        <div className="container">
          <h2 className="mb-8 font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
            {t("eventosTitle")}
          </h2>
          {eventos.length > 0 ? (
            <ul className="space-y-3">
              {eventos.map((e) => {
                const fecha = new Date(e.fecha).toLocaleDateString(
                  locale === "eu" ? "eu" : "es-ES",
                  { weekday: "long", day: "numeric", month: "long" },
                );
                return (
                  <li
                    key={e._id}
                    className="flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-display text-lg font-bold text-azul-700">
                        {pickLocale(e.titulo, locale)}
                      </p>
                      {e.lugar && (
                        <p className="text-sm text-neutral-500">{e.lugar}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold capitalize text-rojo">
                      {fecha}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
              {t("eventosEmpty")}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
