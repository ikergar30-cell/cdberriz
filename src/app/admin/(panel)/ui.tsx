import Link from "next/link";

// Piezas visuales compartidas del panel, para que todas las pantallas hablen
// el mismo idioma: mismos títulos, mismas tarjetas, mismos botones. Si algo
// se quiere cambiar en todo el panel, se cambia aquí.

/** Cabecera de página: título grande, explicación corta y botones de acción. */
export function CabeceraPagina({
  titulo,
  descripcion,
  volver,
  children,
}: {
  titulo: string;
  descripcion?: string;
  /** Enlace "← Volver a…" encima del título. */
  volver?: { href: string; label: string };
  /** Botones/acciones a la derecha. */
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-neutral-100 px-6 pb-6 pt-6 md:px-8 md:pt-8">
      {volver && (
        <Link
          href={volver.href}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-neutral-400 transition hover:text-azul"
        >
          ← {volver.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-extrabold uppercase leading-none tracking-tight text-azul-900 md:text-[34px]">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">{descripcion}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

/** Contenedor del contenido de una página (debajo de la cabecera). */
export function CuerpoPagina({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-6 md:px-8 md:py-8">{children}</div>;
}

const BOTON_BASE =
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60";

const BOTON_TONO = {
  primario: "bg-rojo text-white hover:bg-rojo-600 shadow-sm shadow-rojo/20",
  secundario: "bg-azul text-white hover:bg-azul-700 shadow-sm shadow-azul/20",
  suave: "border border-neutral-200 bg-white text-neutral-700 hover:border-azul-200 hover:text-azul hover:bg-azul-50/50",
} as const;

export type TonoBoton = keyof typeof BOTON_TONO;

/** Botón-enlace del panel. Para <button> usa la clase `clasesBoton`. */
export function BotonEnlace({
  href,
  tono = "suave",
  externo,
  children,
}: {
  href: string;
  tono?: TonoBoton;
  externo?: boolean;
  children: React.ReactNode;
}) {
  const clases = `${BOTON_BASE} ${BOTON_TONO[tono]}`;
  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={clases}>
      {children}
    </Link>
  );
}

export function clasesBoton(tono: TonoBoton = "suave") {
  return `${BOTON_BASE} ${BOTON_TONO[tono]}`;
}

/** Tarjeta blanca con borde suave. */
export function Tarjeta({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-neutral-200/80 bg-white ${className}`}>{children}</div>
  );
}

const TONO_CIFRA = {
  verde: "text-green-600",
  ambar: "text-amber-500",
  rojo: "text-rojo",
  azul: "text-azul",
  neutro: "text-neutral-400",
  morado: "text-purple-600",
} as const;

/** Tarjeta de cifra grande para el Resumen. */
export function TarjetaCifra({
  label,
  valor,
  tono = "azul",
  href,
  pie,
}: {
  label: string;
  valor: string | number;
  tono?: keyof typeof TONO_CIFRA;
  href?: string;
  pie?: string;
}) {
  const contenido = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{label}</p>
      <p className={`mt-2 font-display text-[40px] font-extrabold leading-none tabular-nums ${TONO_CIFRA[tono]}`}>
        {valor}
      </p>
      {pie && <p className="mt-1.5 text-xs text-neutral-400">{pie}</p>}
    </>
  );

  const clases =
    "block rounded-2xl border border-neutral-200/80 bg-white p-5 transition" +
    (href ? " hover:-translate-y-0.5 hover:border-azul-200 hover:shadow-lg hover:shadow-azul-900/5" : "");

  return href ? (
    <Link href={href} className={clases}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

const TONO_AVISO = {
  ambar: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  rojo: "border-rojo-200 bg-rojo-50 text-rojo hover:bg-rojo-100",
  azul: "border-azul-200 bg-azul-50 text-azul-800 hover:bg-azul-100",
} as const;

/** Aviso destacado que lleva a la pantalla donde se resuelve. */
export function Aviso({
  href,
  tono = "ambar",
  children,
  accion = "Ver",
}: {
  href: string;
  tono?: keyof typeof TONO_AVISO;
  children: React.ReactNode;
  accion?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm transition ${TONO_AVISO[tono]}`}
    >
      <span className="leading-relaxed">{children}</span>
      <span className="shrink-0 whitespace-nowrap font-semibold">{accion} →</span>
    </Link>
  );
}
