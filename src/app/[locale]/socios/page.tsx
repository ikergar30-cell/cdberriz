import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { sociosTiposQuery } from "@/sanity/lib/queries";
import type { SocioTipoAbono } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { createAdminClient } from "@/lib/supabase/admin";
import { club } from "@/config/club";
import { CarnetDigitalPromo } from "./CarnetDigitalPromo";

// Tipos de abono por defecto (si aún no se han creado en Sanity)
const TIPOS_DEFAULT: Array<Pick<SocioTipoAbono, "nombre" | "precio" | "destacado">> = [
  { nombre: { es: "Joven", eu: "Gaztea" }, precio: 25 },
  { nombre: { es: "Individual", eu: "Banakakoa" }, precio: 40, destacado: true },
  { nombre: { es: "Familiar", eu: "Familiakoa" }, precio: 60 },
  { nombre: { es: "Jubilado/a", eu: "Erretiratua" }, precio: 25 },
];

// Iconos SVG inline (estilo outline). Mantenemos el patrón del proyecto, que no
// usa librería de iconos.
const ICONOS: Record<string, JSX.Element> = {
  ticket: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25v2.25a.75.75 0 01-.75.75 1.5 1.5 0 100 3 .75.75 0 01.75.75v2.25A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25v-2.25a.75.75 0 01.75-.75 1.5 1.5 0 100-3 .75.75 0 01-.75-.75V6.75z" />
  ),
  voto: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  ),
  carnet: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
  ),
  cantera: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  ),
};

const BENEFICIOS = [
  { icon: "ticket", es: "Entrada gratuita a los partidos en casa.", eu: "Sarrera doan etxeko partidetan." },
  { icon: "voto", es: "Voto en la Asamblea General del club.", eu: "Boto Batzar Nagusian." },
  { icon: "carnet", es: "Carné digital y físico de socio/a.", eu: "Bazkide karnet digitala eta fisikoa." },
  { icon: "cantera", es: "Apoyas directamente a la cantera.", eu: "Harrobia zuzenean laguntzen duzu." },
];

// Deduce la clave de cuota (para el enlace de pago) a partir del nombre en
// castellano. Vale tanto para los tipos por defecto como para los de Sanity.
function claveDeCuota(nombreEs: string): string | null {
  const n = nombreEs.toLowerCase();
  if (n.includes("joven")) return "joven";
  if (n.includes("famili")) return "familiar";
  if (n.includes("jubil")) return "jubilado";
  if (n.includes("individual")) return "individual";
  return null;
}

const FAQ = [
  {
    p: { es: "¿Cómo me hago socio/a?", eu: "Nola egin naiteke bazkide?" },
    r: {
      es: "Elige tu cuota arriba y completa el alta online. El pago es seguro y la renovación, automática cada temporada.",
      eu: "Aukeratu zure kuota goian eta osatu alta sarean. Ordainketa segurua da eta berritzea automatikoa denboraldi bakoitzean.",
    },
  },
  {
    p: { es: "¿Qué diferencia hay entre las cuotas?", eu: "Zer alde dago kuoten artean?" },
    r: {
      es: "Joven (25 €) para menores de 25 años; Individual (40 €) para una persona adulta; Familiar (60 €) cubre a toda la unidad familiar; Jubilado/a (25 €) desde los 65 años.",
      eu: "Gaztea (25 €) 25 urtetik beherakoentzat; Banakakoa (40 €) pertsona heldu batentzat; Familiakoa (60 €) familia osoa hartzen du; Erretiratua (25 €) 65 urtetik aurrera.",
    },
  },
  {
    p: { es: "¿Cómo puedo pagar?", eu: "Nola ordaindu dezaket?" },
    r: {
      es: "Con tarjeta o domiciliación bancaria (SEPA). Eliges el método al hacerte socio/a y la renovación se cobra automáticamente cada temporada.",
      eu: "Txartelarekin edo banku-helbideratzearekin (SEPA). Bazkide egitean aukeratzen duzu metodoa eta berritzea automatikoki kobratzen da denboraldi bakoitzean.",
    },
  },
  {
    p: { es: "¿Puedo cancelar mi abono cuando quiera?", eu: "Nire bazkidetza nahi dudanean bertan behera utz dezaket?" },
    r: {
      es: "Sí. Puedes cancelar la renovación en cualquier momento desde «Gestiona tu cuota». Seguirás siendo socio/a hasta el final del periodo ya pagado.",
      eu: "Bai. Berritzea edozein unetan bertan behera utz dezakezu «Kudeatu zure kuota» atalean. Ordaindutako epea amaitu arte bazkide izaten jarraituko duzu.",
    },
  },
  {
    p: { es: "¿Qué es el carné digital?", eu: "Zer da karnet digitala?" },
    r: {
      es: "Un carné con código QR disponible en tu área personal. Lo muestras en la entrada del campo para acceder a los partidos. También puedes solicitar el carné físico.",
      eu: "QR kodea duen karneta, zure eremu pertsonalean eskuragarri. Zelaiko sarreran erakusten duzu partidetara sartzeko. Karnet fisikoa ere eska dezakezu.",
    },
  },
  {
    p: { es: "¿Cuándo se renueva el abono?", eu: "Noiz berritzen da bazkidetza?" },
    r: {
      es: "El abono es anual y se renueva automáticamente al inicio de cada temporada.",
      eu: "Bazkidetza urtekoa da eta automatikoki berritzen da denboraldi hasieran.",
    },
  },
];

export default async function SociosPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";
  const t = await getTranslations("socios");

  // Datos en paralelo: cuotas (Sanity) y nº de socios activos (Supabase, con
  // service_role porque la tabla está protegida por RLS).
  const admin = createAdminClient();
  const [reales, sociosRes] = await Promise.all([
    sanityFetch<SocioTipoAbono[]>(sociosTiposQuery, {}, []),
    admin.from("socios").select("*", { count: "exact", head: true }).eq("estado", "activo"),
  ]);

  const tipos = reales.length > 0 ? reales : TIPOS_DEFAULT;
  const numSocios = sociosRes.count ?? 0;
  const anios = new Date().getFullYear() - club.fundacion;

  // Cifras del club. El nº de socios es dinámico (solo se muestra si hay datos);
  // el resto son datos facilitados por el club. JUGADORES: actualizar aquí.
  const stats: Array<{ valor: string; label: { es: string; eu: string } }> = [
    { valor: String(club.fundacion), label: { es: "Fundación", eu: "Sorrera" } },
  ];
  if (numSocios > 0)
    stats.push({ valor: `+${numSocios}`, label: { es: "Socios/as", eu: "Bazkideak" } });
  stats.push({ valor: "+200", label: { es: "Jugadores", eu: "Jokalariak" } });
  stats.push({ valor: `${anios}+`, label: { es: "Años de historia", eu: "Urteko historia" } });

  // El grid se adapta al número de cifras para no dejar huecos.
  const colsClass =
    stats.length >= 4 ? "sm:grid-cols-4" : stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <>
      <PageHeader title={t("title")} intro={t("intro")} />
      <div className="container space-y-16 py-12 md:py-16">
        {/* Cifras del club */}
        <section className={`grid grid-cols-2 gap-4 ${colsClass}`}>
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl bg-azul-50 px-4 py-6 text-center">
              <p className="font-display text-3xl font-extrabold text-azul md:text-4xl">{s.valor}</p>
              <p className="mt-1 text-sm text-neutral-600">{pickLocale(s.label, locale)}</p>
            </div>
          ))}
        </section>

        {/* Promoción del carnet digital */}
        <CarnetDigitalPromo locale={locale} />

        {/* Tipos de abono */}
        <section id="cuotas" className="grid scroll-mt-24 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tipos.map((tipo, i) => (
            <div
              key={i}
              className={`flex flex-col items-center rounded-2xl border p-6 text-center ${
                tipo.destacado
                  ? "border-rojo bg-rojo-50 shadow-lg"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <h3 className="font-display text-lg font-bold uppercase text-azul-700">
                {pickLocale(tipo.nombre, locale)}
              </h3>
              <p className="mt-3">
                <span className="font-display text-4xl font-extrabold text-rojo">
                  {tipo.precio} €
                </span>
                <span className="text-sm text-neutral-500">{t("cuotaAnual")}</span>
              </p>
              <div className="mt-5 w-full">
                {(() => {
                  const clave = claveDeCuota(tipo.nombre?.es ?? "");
                  // Si reconocemos la cuota, va al alta con pago; si no, a contacto.
                  const href = clave ? `/socios/alta?cuota=${clave}` : "/contacto";
                  return (
                    <LinkButton
                      href={href}
                      variant={tipo.destacado ? "primary" : "outline"}
                      className="w-full"
                    >
                      {t("hazteSocio")}
                    </LinkButton>
                  );
                })()}
              </div>
            </div>
          ))}
        </section>

        {/* Acceso de socios actuales */}
        <p className="text-center text-sm text-neutral-600">
          {eu ? "Dagoeneko bazkidea zara? " : "¿Ya eres socio/a? "}
          <Link href="/cuenta" className="font-semibold text-azul underline hover:text-rojo">
            {eu ? "Kudeatu zure kuota" : "Gestiona tu cuota"}
          </Link>
        </p>

        {/* Beneficios */}
        <section>
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-neutral-900">
            {t("beneficiosTitle")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {BENEFICIOS.map((b, i) => (
              <li
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-azul-50 text-azul">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.6}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    {ICONOS[b.icon]}
                  </svg>
                </span>
                <span className="text-neutral-700">{eu ? b.eu : b.es}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-neutral-900">
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

        {/* Bloque de contacto */}
        <section className="rounded-2xl bg-azul px-6 py-8 text-center text-white md:px-10 md:py-10">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            {eu ? "Zalantzarik duzu?" : "¿Tienes dudas?"}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-white/80">
            {eu
              ? "Jarri klubarekin harremanetan eta lagunduko dizugu bazkide egiten."
              : "Ponte en contacto con el club y te ayudamos a hacerte socio/a."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
            <a href={`tel:${club.telefono.replace(/\s/g, "")}`} className="font-semibold hover:text-rojo-200">
              {club.telefono}
            </a>
            <a href={`mailto:${club.email}`} className="font-semibold hover:text-rojo-200">
              {club.email}
            </a>
          </div>
          <div className="mt-6">
            <LinkButton href="/contacto" variant="light">
              {eu ? "Kontaktu-formularioa" : "Formulario de contacto"}
            </LinkButton>
          </div>
        </section>
      </div>
    </>
  );
}
