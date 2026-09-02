"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export type ClaveIcono =
  | "resumen" | "buzon" | "socios" | "familias" | "cuotas" | "verificar"
  | "carnets" | "asistencia" | "invitados" | "noticia" | "evento" | "studio"
  | "arbitros" | "entrenadores" | "finanzas" | "empleados";

export type SeccionNav = {
  titulo: string | null;
  items: { href: string; label: string; externo?: boolean; icono?: ClaveIcono }[];
};

// Iconos de línea (20×20) para que cada apartado se localice de un vistazo,
// sin depender de ninguna librería externa.
const ICONOS: Record<ClaveIcono, React.ReactNode> = {
  resumen: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  buzon: <><path d="M3 7l9 6 9-6" /><rect x="3" y="5" width="18" height="14" rx="2" /></>,
  socios: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
  familias: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2 20v-1.5A4.5 4.5 0 0 1 6.5 14h3A4.5 4.5 0 0 1 14 18.5V20" /><path d="M16 20v-1a3.5 3.5 0 0 1 3.5-3.5H20" /></>,
  cuotas: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 11h20" /><path d="M6 15.5h3" /></>,
  verificar: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3z" /><path d="M20 14v3M17 20h4" /></>,
  carnets: <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M14 10h5M14 14h5M5 16.5c.8-1.4 4.2-1.4 5 0" /></>,
  asistencia: <><path d="M3 20V10M9 20V4M15 20v-7M21 20v-4" /></>,
  invitados: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
  noticia: <><path d="M4 4h13a2 2 0 0 1 2 2v13a2 2 0 0 0 2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 1-2z" /><path d="M8 8h7M8 12h7M8 16h4" /></>,
  evento: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  studio: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7" /></>,
  arbitros: <><path d="M12 3v18" /><circle cx="12" cy="12" r="9" /><path d="M8 8l8 8M16 8l-8 8" /></>,
  entrenadores: <><circle cx="12" cy="7" r="3" /><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" /><path d="M9 11l3 3 3-3" /></>,
  finanzas: <><path d="M3 17l6-6 4 4 7-7" /><path d="M14 8h6v6" /></>,
  empleados: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
};

function Icono({ clave }: { clave?: ClaveIcono }) {
  if (!clave) return <span className="h-[18px] w-[18px]" />;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
    >
      {ICONOS[clave]}
    </svg>
  );
}

// Navegación del panel agrupada por áreas de trabajo. Marca el enlace activo
// según la ruta y en móvil se pliega en un menú desplegable.
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
          <p className="mb-1.5 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">
            {s.titulo}
          </p>
        )}
        <ul className="space-y-0.5">
          {s.items.map((i) => {
            const esActivo = activo(i.href) && !i.externo;
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  target={i.externo ? "_blank" : undefined}
                  rel={i.externo ? "noopener noreferrer" : undefined}
                  onClick={onClick}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    esActivo
                      ? "bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {esActivo && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-rojo-500" />
                  )}
                  <span className={esActivo ? "text-rojo-400" : "text-white/40 group-hover:text-white/70"}>
                    <Icono clave={i.icono} />
                  </span>
                  <span className="truncate">{i.label}</span>
                  {i.externo && <span className="ml-auto text-[10px] text-white/30">↗</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ));

  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  const pie = (
    // Fondo propio: si la lista de enlaces es más larga que la pantalla, el
    // scroll no debe verse por detrás del pie.
    <div className="border-t border-white/10 bg-[#061726] p-3">
      <div className="mb-1 flex items-center gap-2.5 px-2 py-1.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-bold text-white">
          {inicial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white/90">{nombre}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/35">
            {esAdmin ? "Administrador" : "Empleado"}
          </p>
        </div>
      </div>
      {logout}
    </div>
  );

  const marca = (compacto?: boolean) => (
    <div className="flex items-center gap-3">
      <Image
        src="/escudo.png"
        alt=""
        width={40}
        height={40}
        className={compacto ? "h-8 w-8 object-contain" : "h-10 w-10 object-contain"}
      />
      <div>
        <p className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-white">
          C.D. Berriz
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-dorado-400">
          Intranet
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Barra superior (solo móvil) */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-azul-900 px-4 py-3 md:hidden">
        {marca(true)}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {abierto ? "✕" : "☰"}
        </button>
      </header>

      {/* Menú desplegable móvil */}
      {abierto && (
        <div className="bg-azul-900 px-3 pb-3 md:hidden">
          {enlaces(() => setAbierto(false))}
          {pie}
        </div>
      )}

      {/* Sidebar escritorio */}
      <aside className="hidden w-[248px] shrink-0 flex-col bg-gradient-to-b from-azul-900 to-[#061726] md:flex">
        <div className="px-5 py-5">{marca()}</div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">{enlaces()}</nav>
        {pie}
      </aside>
    </>
  );
}
