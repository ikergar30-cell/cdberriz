import Image from "next/image";

// Pantalla de "no encontrado" con la imagen del club. Se reutiliza en las
// distintas zonas del sitio (web pública, intranet, panel), porque cada una
// tiene su propio layout raíz y necesita su propio not-found.
export function PaginaNoEncontrada({
  titulo = "Página no encontrada",
  texto = "La página que buscas no existe o ha cambiado de sitio.",
  enlace = { href: "/", label: "Volver al inicio" },
  codigo = "404",
}: {
  titulo?: string;
  texto?: string;
  enlace?: { href: string; label: string };
  codigo?: string;
}) {
  return (
    <section className="relative isolate flex min-h-[75vh] flex-col items-center justify-center gap-5 overflow-hidden bg-azul-900 px-6 py-24 text-center text-white">
      {/* Foto del campo de fondo, muy difuminada: da profundidad sin distraer. */}
      <Image
        src="/campo-noche.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 scale-110 object-cover object-center blur-lg"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-azul-900/95 via-azul-900/90 to-rojo-900/80" />

      <Image
        src="/escudo-blanco.png"
        alt="C.D. Berriz"
        width={96}
        height={96}
        className="h-20 w-20 object-contain opacity-90 drop-shadow-lg md:h-24 md:w-24"
        priority
      />
      <p className="font-display text-7xl font-extrabold leading-none tracking-tight text-dorado md:text-8xl">
        {codigo}
      </p>
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
        {titulo}
      </h1>
      <p className="max-w-md text-white/70">{texto}</p>
      <a
        href={enlace.href}
        className="mt-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-azul-800 transition hover:bg-neutral-100"
      >
        {enlace.label}
      </a>
    </section>
  );
}
