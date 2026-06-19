import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import { equiposQuery } from "@/sanity/lib/queries";
import type { Equipo } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { urlForImage } from "@/sanity/image";

// Equipos por defecto (se muestran mientras no haya datos en Sanity)
const FEDERADO = ["Regional", "Juvenil A", "Juvenil B", "Cadete A", "Cadete B", "Veteranos"];
const ESCOLAR = ["Infantil 2013", "Infantil 2014", "Alevín 2015", "Alevín 2016", "Benjamín 2017", "Benjamín 2018", "Fútbol Eskola"];
const BALONCESTO = ["Minibasket", "Infantil"];

type Item = { key: string; nombre: string; categoria: string; foto: Equipo["foto"] | null };

export default async function EquiposPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("equipos");

  const equipos = await sanityFetch<Equipo[]>(equiposQuery, {}, []);
  const fed = equipos.filter((e) => e.grupo === "federado");
  const esc = equipos.filter((e) => e.grupo === "escolar");
  const bal = equipos.filter((e) => e.grupo === "baloncesto");

  const toItems = (reales: Equipo[], def: string[]): Item[] =>
    reales.length > 0
      ? reales.map((e) => ({
          key: e._id,
          nombre: pickLocale(e.nombre, locale),
          categoria: e.categoria,
          foto: e.foto ?? null,
        }))
      : def.map((nombre) => ({ key: nombre, nombre, categoria: "", foto: null }));

  return (
    <>
      <PageHeader title={t("title")} intro={t("intro")} />
      <div className="container space-y-14 py-12">
        <Grupo titulo={t("federado")} items={toItems(fed, FEDERADO)} />
        <Grupo titulo={t("escolar")} items={toItems(esc, ESCOLAR)} />
        <Grupo titulo={t("baloncesto")} items={toItems(bal, BALONCESTO)} />
      </div>
    </>
  );
}

function Grupo({
  titulo,
  items,
  vacio,
}: {
  titulo: string;
  items: Item[];
  vacio?: string;
}) {
  return (
    <section>
      <h2 className="mb-6 inline-block border-b-4 border-dorado pb-1 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
        {titulo}
      </h2>
      {items.length === 0 && vacio ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          {vacio}
        </p>
      ) : (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => {
          const img = it.foto
            ? urlForImage(it.foto).width(600).height(400).fit("crop").url()
            : null;
          return (
            <div
              key={it.key}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
            >
              <div className="relative flex aspect-[3/2] items-center justify-center bg-azul-50">
                {img ? (
                  <Image src={img} alt={it.nombre} fill className="object-cover" />
                ) : (
                  <Image
                    src="/escudo.png"
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain opacity-70"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-bold text-neutral-900">
                  {it.nombre}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
