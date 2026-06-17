import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { pickLocale } from "@/lib/locale";

// Contenido de ejemplo. Sustituir por el texto real de la historia del club.
const PARRAFOS = [
  {
    es: "El Club Deportivo Berriz nació en 1973 con un objetivo claro: ofrecer a los jóvenes de Berriz un lugar donde crecer a través del fútbol y de los valores del deporte.",
    eu: "Berriz Kirol Kluba 1973an sortu zen helburu argi batekin: Berrizko gazteei futbolaren eta kirolaren balioen bidez hazteko leku bat eskaintzea.",
  },
  {
    es: "Desde entonces, generaciones de jugadoras y jugadores han vestido la camiseta roja y azul, formando una gran familia que va mucho más allá del terreno de juego.",
    eu: "Ordutik, jokalari belaunaldiek elastiko gorri-urdina jantzi dute, zelaitik harago doan familia handi bat osatuz.",
  },
  {
    es: "Hoy, más de 50 años después, el club sigue creciendo con la misma ilusión del primer día: «50 urte ilusioak elkarbanatuz».",
    eu: "Gaur, 50 urte baino gehiago geroago, kluba lehen eguneko ilusio berarekin hazten jarraitzen du: «50 urte ilusioak elkarbanatuz».",
  },
];

export default async function HistoriaPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("club");

  return (
    <>
      <PageHeader title={t("historiaTitle")} />
      <div className="container max-w-3xl space-y-5 py-12 text-lg leading-relaxed text-neutral-700">
        {PARRAFOS.map((p, i) => (
          <p key={i}>{pickLocale(p, locale)}</p>
        ))}
      </div>
    </>
  );
}
