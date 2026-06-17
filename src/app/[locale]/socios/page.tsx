import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { sociosTiposQuery } from "@/sanity/lib/queries";
import type { SocioTipoAbono } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";

// Tipos de abono por defecto (si aún no se han creado en Sanity)
const TIPOS_DEFAULT: Array<Pick<SocioTipoAbono, "nombre" | "precio" | "destacado">> = [
  { nombre: { es: "Joven", eu: "Gaztea" }, precio: 25 },
  { nombre: { es: "Individual", eu: "Banakakoa" }, precio: 40, destacado: true },
  { nombre: { es: "Familiar", eu: "Familiakoa" }, precio: 60 },
  { nombre: { es: "Jubilado/a", eu: "Erretiratua" }, precio: 25 },
];

const BENEFICIOS = [
  { es: "Entrada libre a los partidos en casa.", eu: "Sarrera doan etxeko partidetan." },
  { es: "Descuentos en la tienda del club.", eu: "Deskontuak klubaren dendan." },
  { es: "Apoyas directamente a la cantera.", eu: "Harrobia zuzenean laguntzen duzu." },
  { es: "Invitaciones a los eventos del club.", eu: "Klubaren ekitaldietarako gonbidapenak." },
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
      es: "Rellena el formulario de contacto y nos pondremos en contacto contigo.",
      eu: "Bete kontaktu-formularioa eta zurekin harremanetan jarriko gara.",
    },
  },
  {
    p: { es: "¿Cuándo se renueva el abono?", eu: "Noiz berritzen da bazkidetza?" },
    r: {
      es: "El abono es anual y se renueva al inicio de cada temporada.",
      eu: "Bazkidetza urtekoa da eta denboraldi hasieran berritzen da.",
    },
  },
];

export default async function SociosPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("socios");

  const reales = await sanityFetch<SocioTipoAbono[]>(sociosTiposQuery, {}, []);
  const tipos = reales.length > 0 ? reales : TIPOS_DEFAULT;

  return (
    <>
      <PageHeader title={t("title")} intro={t("intro")} />
      <div className="container space-y-16 py-12 md:py-16">
        {/* Tipos de abono */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          {locale === "eu" ? "Dagoeneko bazkidea zara? " : "¿Ya eres socio/a? "}
          <Link href="/cuenta" className="font-semibold text-azul underline hover:text-rojo">
            {locale === "eu" ? "Kudeatu zure kuota" : "Gestiona tu cuota"}
          </Link>
        </p>

        {/* Beneficios */}
        <section>
          <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-neutral-900">
            {t("beneficiosTitle")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BENEFICIOS.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <span className="mt-0.5 text-rojo">✓</span>
                <span className="text-neutral-700">{pickLocale(b, locale)}</span>
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
      </div>
    </>
  );
}
