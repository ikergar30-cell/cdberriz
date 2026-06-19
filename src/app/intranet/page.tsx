import Image from "next/image";
import Link from "next/link";

const herramientas = [
  {
    titulo: "Gestión de socios",
    descripcion: "Altas, bajas, cuotas, carné digital y domiciliaciones SEPA.",
    href: "/admin/socios",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    titulo: "Panel completo",
    descripcion: "Acceso al panel de administración con todas las secciones.",
    href: "/admin",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    titulo: "Verificar carné",
    descripcion: "Comprueba la validez del carné digital de un socio.",
    href: "/verificar",
    icono: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M13 10h5M13 14h5M7 14h2" />
      </svg>
    ),
    proximamente: false,
  },
];

export default function IntranetPage() {
  return (
    <main className="flex min-h-screen flex-col bg-neutral-50">
      {/* Cabecera */}
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/escudo.png"
              alt="C.D. Berriz"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="font-display text-lg font-extrabold uppercase tracking-tight text-neutral-900">
              C.D. Berriz
            </span>
          </Link>
          <Link
            href="/admin/login"
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-600 transition hover:border-azul hover:text-azul"
          >
            Acceder
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="mb-10">
          <span className="inline-block rounded-full bg-azul-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-azul-700">
            Portal interno
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold uppercase text-neutral-900 md:text-4xl">
            Intranet empleados
          </h1>
          <p className="mt-2 text-base text-neutral-500">
            Accede a las herramientas de gestión del club. Si no has iniciado sesión, serás
            redirigido a la pantalla de acceso.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {herramientas.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="group relative flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-azul hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-azul-50 text-azul-600 transition group-hover:bg-azul group-hover:text-white">
                {h.icono}
              </div>
              <div>
                <h2 className="font-display text-base font-bold uppercase tracking-tight text-neutral-900">
                  {h.titulo}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">{h.descripcion}</p>
              </div>
              <span className="absolute right-5 top-5 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-azul">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pie */}
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
        <Link href="/" className="hover:text-neutral-600">← Volver a cdberriz.com</Link>
        <span className="mx-3">·</span>
        <span>C.D. Berriz · Uso exclusivo para empleados del club</span>
      </footer>
    </main>
  );
}
