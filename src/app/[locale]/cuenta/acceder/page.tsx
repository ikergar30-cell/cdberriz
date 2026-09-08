import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";

// Página intermedia del enlace mágico. El correo apunta AQUÍ, no directamente
// a /auth/callback: abrir esta página NO inicia sesión (no gasta el token de
// un solo uso), así que el escaneo/pre-carga de enlaces que hacen los clientes
// de correo de Android (Gmail) no la rompe. El token solo se canjea cuando la
// persona pulsa el botón "Entrar", que lleva ya sí a /auth/callback.
export default function AccederPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { token_hash?: string; next?: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  const tokenHash = typeof searchParams.token_hash === "string" ? searchParams.token_hash : "";
  const next =
    typeof searchParams.next === "string" && searchParams.next.startsWith("/")
      ? searchParams.next
      : `/${locale}/cuenta`;

  const urlCallback = `/auth/callback?token_hash=${encodeURIComponent(
    tokenHash,
  )}&type=magiclink&next=${encodeURIComponent(next)}`;

  return (
    <>
      <PageHeader title={eu ? "Nire karneta" : "Mi carné"} />
      <div className="container flex max-w-md flex-col items-center py-16 text-center md:py-20">
        <Image
          src="/escudo.png"
          alt="C.D. Berriz"
          width={72}
          height={72}
          className="h-16 w-16 object-contain"
        />

        {tokenHash ? (
          <>
            <h1 className="mt-5 font-display text-2xl font-extrabold uppercase text-azul-800">
              {eu ? "Ia barruan zaude" : "Ya casi estás dentro"}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {eu
                ? "Sakatu botoia zure bazkide-karneta ikusteko."
                : "Pulsa el botón para entrar y ver tu carné de socio/a."}
            </p>
            <a
              href={urlCallback}
              rel="nofollow"
              className="mt-6 inline-block rounded-full bg-rojo px-8 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600"
            >
              {eu ? "Nire karnetera sartu" : "Entrar a mi carné"}
            </a>
            <p className="mt-4 text-xs text-neutral-400">
              {eu
                ? "Esteka behin bakarrik erabil daiteke eta ordubete barru iraungitzen da."
                : "El enlace solo se puede usar una vez y caduca en una hora."}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-2xl font-extrabold uppercase text-azul-800">
              {eu ? "Esteka ez da baliozkoa" : "Enlace no válido"}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {eu
                ? "Esteka honek iraungi du edo ez da osorik ireki. Eskatu beste bat."
                : "Este enlace ha caducado o no se ha abierto completo. Pide uno nuevo."}
            </p>
            <Link
              href="/cuenta"
              className="mt-6 inline-block rounded-full bg-rojo px-8 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600"
            >
              {eu ? "Beste esteka bat eskatu" : "Pedir un enlace nuevo"}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
