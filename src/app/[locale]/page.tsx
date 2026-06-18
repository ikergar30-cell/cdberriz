import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { LinkButton } from "@/components/ui/Button";
import { NoticiaCard } from "@/components/sections/NoticiaCard";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import {
  noticiasRecientesQuery,
  eventosProximosQuery,
  paginaInicioQuery,
  sponsorsQuery,
} from "@/sanity/lib/queries";
import type { Noticia, Evento, PaginaInicio, Sponsor } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { urlForImage } from "@/sanity/image";
import { club } from "@/config/club";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tNot = await getTranslations("noticias");
  const eu = locale === "eu";
  const tx = (es: string, e: string) => (eu ? e : es);

  const [inicio, noticias, eventos, sponsors] = await Promise.all([
    sanityFetch<PaginaInicio | null>(paginaInicioQuery, {}, null),
    sanityFetch<Noticia[]>(noticiasRecientesQuery, {}, []),
    sanityFetch<Evento[]>(eventosProximosQuery, {}, []),
    sanityFetch<Sponsor[]>(sponsorsQuery, {}, []),
  ]);

  // Imagen del hero: la de Sanity si existe; si no, la foto del campo de Berrizburu.
  const heroImg = inicio?.heroImagen
    ? urlForImage(inicio.heroImagen).width(1920).height(900).fit("crop").url()
    : "/inicio/campo-berrizburu.jpg";
  const heroTitulo = pickLocale(inicio?.heroTitulo, locale) || "C.D. Berriz";
  const heroSubtitulo =
    pickLocale(inicio?.heroSubtitulo, locale) || t("heroTagline");
  const anios = new Date().getFullYear() - club.fundacion;

  // Las dos primeras tarjetas llevan a contacto; la tercera, a socios.
  const cards = [
    { title: t("card1Title"), text: t("card1Text"), href: "/contacto", variant: "primary" as const },
    { title: t("card2Title"), text: t("card2Text"), href: "/contacto", variant: "secondary" as const },
    { title: t("card3Title"), text: t("card3Text"), href: "/socios", variant: "primary" as const },
  ];

  const stats = [
    { num: String(club.fundacion), label: tx("Año de fundación", "Sorrera-urtea") },
    { num: `${anios}+`, label: tx("Años de historia", "Urteko historia") },
    { num: tx("Fútbol · Baloncesto", "Futbola · Saskibaloia"), label: tx("Secciones del club", "Klubaren sailak") },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <Image
          src={heroImg}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        {/* Velo azul para que el escudo y el texto se lean sobre la foto */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-azul-900/90 via-azul-800/80 to-rojo-800/75" />
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
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/socios" variant="light">
              {t("heroCta")}
            </LinkButton>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-azul-700"
            >
              {tx("Contacto", "Kontaktua")}
            </Link>
          </div>
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

      {/* CIFRAS DEL CLUB */}
      <section className="container py-14 md:py-16">
        <div className="grid gap-6 rounded-3xl bg-azul-900 px-6 py-10 text-center text-white sm:grid-cols-3 md:px-12">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-extrabold text-dorado md:text-4xl">
                {s.num}
              </p>
              <p className="mt-1 text-sm font-medium text-azul-100">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NOTICIAS RECIENTES */}
      <section className="container pb-16 md:pb-20">
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

      {/* CONOCE EL CLUB (historia) */}
      <section className="bg-neutral-50 py-16 md:py-20">
        <div className="container grid items-center gap-8 md:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/historia/accion-bn.jpg"
                alt={tx("Historia del C.D. Berriz", "C.D. Berrizen historia")}
                fill
                className="object-cover"
              />
            </div>
            {/* Sello del 50 aniversario */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-50urte.svg"
              alt="50 urte · C.D. Berriz"
              className="absolute -bottom-5 -right-4 w-24 drop-shadow-xl md:w-28"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-neutral-900">
              {tx("Más de 50 años de club", "50 urte baino gehiagoko kluba")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">
              {tx(
                "Desde 1973, el C.D. Berriz ha crecido como una gran familia: fútbol federado y escolar, baloncesto y, sobre todo, comunidad. Conoce nuestra historia.",
                "1973az geroztik, C.D. Berriz familia handi bat bezala hazi da: futbol federatua eta eskolakoa, saskibaloia eta, batez ere, komunitatea. Ezagutu gure historia.",
              )}
            </p>
            <LinkButton href="/club/historia" variant="secondary" className="mt-6">
              {tx("Nuestra historia", "Gure historia")}
            </LinkButton>
          </div>
        </div>
      </section>

      {/* PRÓXIMOS EVENTOS */}
      <section className="container py-16 md:py-20">
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
                    {e.lugar && <p className="text-sm text-neutral-500">{e.lugar}</p>}
                  </div>
                  <p className="text-sm font-semibold capitalize text-rojo">{fecha}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            {t("eventosEmpty")}
          </p>
        )}
      </section>

      {/* PATROCINADORES (solo si los hay) */}
      {sponsors.length > 0 && (
        <section className="border-t border-neutral-200 py-12">
          <div className="container">
            <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-neutral-400">
              {tx("Con el apoyo de", "Honen babesarekin")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {sponsors.slice(0, 8).map((s) =>
                s.logo ? (
                  <Image
                    key={s._id}
                    src={urlForImage(s.logo).width(240).fit("max").url()}
                    alt={s.nombre}
                    width={120}
                    height={60}
                    className="h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                  />
                ) : null,
              )}
            </div>
            <div className="mt-6 text-center">
              <Link href="/patrocinadores" className="text-sm font-semibold text-azul hover:underline">
                {tx("Ver todos los patrocinadores", "Ikusi babesle guztiak")} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* LLAMADA FINAL */}
      <section className="bg-gradient-to-br from-rojo-700 to-azul-800 py-16 text-center text-white md:py-20">
        <div className="container">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
            {tx("Forma parte del C.D. Berriz", "Izan zaitez C.D. Berrizeko parte")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            {tx(
              "Hazte socio/a, apunta a tus hijos e hijas o súmate como voluntario. El club lo hacemos entre todas y todos.",
              "Egin zaitez bazkide, eman izena zure seme-alabei edo batu zaitez boluntario gisa. Kluba guztion artean egiten dugu.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/socios" variant="light">
              {tx("Hazte socio/a", "Bazkide egin")}
            </LinkButton>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-azul-700"
            >
              {tx("Contacto", "Kontaktua")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
