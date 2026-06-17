"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { club } from "@/config/club";

type NavItem = { href: string; label: string };

export function Header() {
  const t = useTranslations("nav");
  const tSocios = useTranslations("socios");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);

  const mainNav: NavItem[] = [
    { href: "/", label: t("inicio") },
    { href: "/noticias", label: t("noticias") },
    { href: "/equipos", label: t("equipos") },
    { href: "/socios", label: t("socios") },
  ];
  const clubNav: NavItem[] = [
    { href: "/club/informacion", label: t("clubInfo") },
    { href: "/club/historia", label: t("historia") },
    { href: "/club/familias", label: t("familias") },
    { href: "/patrocinadores", label: t("patrocinadores") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? "text-rojo" : "text-neutral-700 hover:text-azul"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/escudo.png"
            alt="Escudo C.D. Berriz"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="font-display text-lg font-extrabold uppercase leading-none tracking-tight text-azul-700">
            C.D. Berriz
          </span>
        </Link>

        {/* Navegación escritorio */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(isActive(item.href))}
            >
              {item.label}
            </Link>
          ))}

          {/* Tienda (enlace externo) */}
          <a
            href={club.tiendaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass(false)}
          >
            {t("tienda")}
          </a>

          {/* Submenú Club */}
          <div
            className="relative"
            onMouseEnter={() => setClubOpen(true)}
            onMouseLeave={() => setClubOpen(false)}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1 ${linkClass(
                pathname.startsWith("/club"),
              )}`}
              aria-expanded={clubOpen}
              onClick={() => setClubOpen((v) => !v)}
            >
              {t("club")}
              <ChevronDown />
            </button>
            {clubOpen && (
              <div className="absolute left-0 top-full w-60 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                {clubNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-azul"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/contacto"
            className={linkClass(isActive("/contacto"))}
          >
            {t("contacto")}
          </Link>
        </nav>

        {/* Acciones derecha (escritorio) */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Link
            href="/socios"
            className="rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600"
          >
            {tSocios("hazteSocio")}
          </Link>
        </div>

        {/* Botón menú móvil */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? t("cerrarMenu") : t("abrirMenu")}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white lg:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 font-semibold ${
                  isActive(item.href) ? "text-rojo" : "text-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <a
              href={club.tiendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 font-semibold text-neutral-800"
            >
              {t("tienda")}
            </a>

            <div className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-neutral-400">
              {t("club")}
            </div>
            {clubNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-neutral-700"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/contacto"
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 font-semibold ${
                isActive("/contacto") ? "text-rojo" : "text-neutral-800"
              }`}
            >
              {t("contacto")}
            </Link>

            <div className="mt-3 flex items-center justify-between gap-3 px-3">
              <LanguageSwitcher />
              <Link
                href="/socios"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white"
              >
                {tSocios("hazteSocio")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
