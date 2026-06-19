import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { club } from "@/config/club";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const redes = [
    { name: "Facebook", href: club.redes.facebook, icon: <FacebookIcon /> },
    { name: "Instagram", href: club.redes.instagram, icon: <InstagramIcon /> },
    { name: "TikTok", href: club.redes.tiktok, icon: <TikTokIcon /> },
    { name: "X", href: club.redes.twitter, icon: <XIcon /> },
    { name: "YouTube", href: club.redes.youtube, icon: <YouTubeIcon /> },
  ];

  const nav = [
    { href: "/noticias", label: t("nav.noticias") },
    { href: "/equipos", label: t("nav.equipos") },
    { href: "/socios", label: t("nav.socios") },
    { href: "/patrocinadores", label: t("nav.patrocinadores") },
    { href: "/club/informacion", label: t("nav.clubInfo") },
    { href: "/contacto", label: t("nav.contacto") },
  ] as const;

  return (
    <footer className="bg-azul-900 text-azul-100">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Image
              src="/escudo.png"
              alt="Escudo C.D. Berriz"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
            <span className="font-display text-xl font-extrabold uppercase text-white">
              C.D. Berriz
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm">{t("footer.direccion")}</p>
          <p className="mt-2 text-sm font-semibold text-dorado">
            {t("home.heroTagline")}
          </p>
          {/* Sello del 50 aniversario */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-50urte.svg"
            alt="50 urte · C.D. Berriz"
            className="mt-5 w-24 opacity-90"
          />
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            {t("footer.navTitle")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="transition hover:text-white">
                  {i.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={club.tiendaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                {t("nav.tienda")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
            {t("footer.siguenos")}
          </h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {redes.map((r) => (
              <a
                key={r.name}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={r.name}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-rojo"
              >
                {r.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-2 py-5 text-center text-xs sm:flex-row sm:justify-between">
          <span>© {year} C.D. Berriz · CIF G48309108 · {t("footer.derechos")}</span>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-azul-300">
            <Link href="/legal/aviso-legal" className="hover:text-white transition">Aviso Legal</Link>
            <Link href="/legal/privacidad" className="hover:text-white transition">Privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-white transition">Cookies</Link>
            <span className="text-white/20">·</span>
            <a href="/intranet" className="hover:text-white transition opacity-50 hover:opacity-100">Empleados</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 3c.3 2.1 1.6 3.6 3.7 3.9v2.6c-1.3.1-2.6-.3-3.7-1v5.6c0 3.2-2.6 5.4-5.5 5.4S5 19.3 5 16.4c0-2.8 2.2-5 5-5 .3 0 .6 0 .9.1v2.7c-.3-.1-.6-.2-.9-.2-1.3 0-2.3 1-2.3 2.3 0 1.4 1 2.4 2.3 2.4 1.4 0 2.4-1 2.4-2.6V3H16z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.2 3H21l-6.5 7.4L22 21h-6l-4.7-6.1L5.8 21H3l7-8L2.5 3h6.1l4.2 5.6L18.2 3zm-2.1 16h1.7L7.9 4.8H6.1L16.1 19z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 8.2c-.2-1.4-.8-2.2-2.2-2.4C17.8 5.5 12 5.5 12 5.5s-5.8 0-7.8.3C2.8 6 2.2 6.8 2 8.2 1.8 9.7 1.8 12 1.8 12s0 2.3.2 3.8c.2 1.4.8 2.2 2.2 2.4 2 .3 7.8.3 7.8.3s5.8 0 7.8-.3c1.4-.2 2-1 2.2-2.4.2-1.5.2-3.8.2-3.8s0-2.3-.2-3.8zM10 15V9l5 3-5 3z" />
    </svg>
  );
}
