"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export type SeccionNav = {
  titulo: string | null;
  items: { href: string; label: string; externo?: boolean }[];
};

// Navegación del panel agrupada por áreas de trabajo. Marca el enlace activo
// según la ruta y en móvil se pliega en un menú desplegable (la versión
// anterior ocultaba la sidebar en móvil y dejaba el panel sin navegación).
export function NavPanel({
  secciones,
  nombre,
  esAdmin,
  logout,
}: {
  secciones: SeccionNav[];
  nombre: string;
  esAdmin: boolean;
  logout: React.ReactNode;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const activo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const enlaces = (onClick?: () => void) =>
    secciones.map((s) => (
      <div key={s.titulo ?? "principal"}>
        {s.titulo && (
          <p className="mb-1 mt-5 px-3 text-[11px] font-bold uppercase tracking-widest text-rojo-200">
            {s.titulo}
          </p>
        )}
        <ul className="space-y-0.5">
          {s.items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                target={i.externo ? "_blank" : undefined}
                rel={i.externo ? "noopener noreferrer" : undefined}
                onClick={onClick}
                className={`block rounded-lg border-l-2 px-3 py-2 text-sm font-semibold transition ${
                  activo(i.href) && !i.externo
                    ? "border-dorado bg-white/10 text-white"
                    : "border-transparent text-rojo-100 hover:bg-white/5 hover:text-white"
                }`}
              >
                {i.label}
                {i.externo && " ↗"}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ));

  const pie = (
    <div className="border-t border-white/10 p-3">
      <p className="px-3 pb-2 text-xs text-rojo-200">
        {nombre}
        {esAdmin && " · admin"}
      </p>
      {logout}
    </div>
  );

  return (
    <>
      {/* Barra superior (solo móvil) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-dorado bg-rojo-800 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <Image src="/escudo.png" alt="" width={30} height={30} className="h-8 w-8 object-contain" />
          <span className="font-display text-sm font-extrabold uppercase text-white">
            C.D. Berriz · Intranet
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white"
        >
          {abierto ? "✕" : "☰"}
        </button>
      </header>

      {/* Menú desplegable móvil */}
      {abierto && (
        <div className="border-b-2 border-dorado bg-rojo-800 p-3 md:hidden">
          {enlaces(() => setAbierto(false))}
          {pie}
        </div>
      )}

      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col border-r-2 border-dorado bg-gradient-to-b from-rojo-700 to-rojo-900 md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Image src="/escudo.png" alt="" width={38} height={38} className="h-10 w-10 object-contain" />
          <div>
            <p className="font-display text-sm font-extrabold uppercase leading-tight text-white">
              C.D. Berriz
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-dorado">
              Intranet
            </p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">{enlaces()}</nav>
        {pie}
      </aside>
    </>
  );
}
