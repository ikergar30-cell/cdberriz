import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { EQUIPOS_CADETES, type JugadorEquipo } from "@/data/equiposCadetes";

// Página de un equipo con su plantilla de jugadores/as. De momento se sirve de
// datos LOCALES (src/data/equiposCadetes.ts) para montar el diseño antes de
// publicar; más adelante pasará a Sanity con el consentimiento verificado.
export function generateStaticParams() {
  return Object.keys(EQUIPOS_CADETES).map((slug) => ({ slug }));
}

const TEMPORADA = "2026 / 2027";

export default function EquipoPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const equipo = EQUIPOS_CADETES[slug];
  if (!equipo) notFound();
  const eu = locale === "eu";

  // Orden por dorsal (los que lo tengan, ascendente); el resto, por apellido.
  const jugadores = [...equipo.jugadores].sort(
    (a, b) =>
      (a.dorsal ?? 999) - (b.dorsal ?? 999) ||
      a.apellidos.localeCompare(b.apellidos, "es"),
  );

  return (
    <>
      {/* Cabecera del equipo */}
      <header className="relative overflow-hidden bg-azul-900">
        <div className="absolute inset-0 opacity-[0.06]">
          <Image src="/escudo.png" alt="" fill className="object-contain object-right" priority />
        </div>
        <div className="container relative py-12 md:py-16">
          <Link
            href="/equipos"
            className="text-sm font-semibold text-white/60 transition hover:text-white"
          >
            ← {eu ? "Taldeak" : "Equipos"}
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-dorado-400">
            {equipo.grupo} · {TEMPORADA}
          </p>
          <h1 className="mt-1 font-display text-4xl font-extrabold uppercase tracking-tight text-white md:text-6xl">
            {equipo.nombre}
          </h1>
          <p className="mt-3 text-sm text-white/70">
            {equipo.jugadores.length} {eu ? "jokalari" : "jugadores"}
          </p>
        </div>
      </header>

      {/* Plantilla */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {jugadores.map((j, i) => (
            <JugadorCard key={`${j.nombre}-${i}`} jugador={j} />
          ))}
        </div>

        {/* Cuerpo técnico */}
        {equipo.cuerpoTecnico.length > 0 && (
          <section className="mt-14 md:mt-16">
            <h2 className="mb-6 inline-block border-b-4 border-dorado pb-1 font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700">
              {eu ? "Talde teknikoa" : "Cuerpo técnico"}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {equipo.cuerpoTecnico.map((m, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_3px_rgba(10,47,77,0.05)]"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-dorado-600">
                    {m.rol}
                  </p>
                  <p className={`mt-1 font-display text-lg font-bold ${m.nombre ? "text-neutral-900" : "text-neutral-300"}`}>
                    {m.nombre || (eu ? "Esleitzeke" : "Por asignar")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function JugadorCard({ jugador }: { jugador: JugadorEquipo }) {
  const src = jugador.foto ? `/equipos/fotos/${jugador.foto}` : null;
  return (
    // Fondo del club (granate → azul) sobre el que se coloca el recorte del jugador.
    <article className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-[linear-gradient(150deg,#7a1420_0%,#0a2f4d_55%,#061726_100%)] shadow-[0_1px_3px_rgba(10,47,77,0.08),0_16px_34px_-18px_rgba(10,47,77,0.5)]">
      {/* Brillo suave que se enciende al pasar el ratón */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_12%,rgba(255,255,255,0.14),transparent_60%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

      {src ? (
        <Image
          src={src}
          alt={`${jugador.nombre} ${jugador.apellidos}`}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="flex h-full w-full items-end justify-center">
          {/* Silueta neutra mientras no hay foto asignada */}
          <svg viewBox="0 0 24 24" className="h-3/4 w-3/4 translate-y-2 text-white/10" fill="currentColor" aria-hidden="true">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.7-9 6v2h18v-2c0-3.3-4-6-9-6Z" />
          </svg>
        </div>
      )}

      {/* Dorsal */}
      {jugador.dorsal != null && (
        <span className="absolute right-3 top-1 font-display text-5xl font-extrabold leading-none text-white/25">
          {jugador.dorsal}
        </span>
      )}

      {/* Degradado inferior para que el nombre se lea siempre */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      {/* Línea granate de acento */}
      <span className="absolute bottom-[62px] left-4 h-0.5 w-8 rounded-full bg-rojo-500 transition-all duration-300 group-hover:w-14" />

      {/* Nombre */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-display text-lg font-bold uppercase leading-none tracking-wide text-white">
          {jugador.nombre}
        </p>
        {jugador.apellidos && (
          <p className="mt-1 text-sm font-medium leading-tight text-white/75">
            {jugador.apellidos}
          </p>
        )}
      </div>
    </article>
  );
}
