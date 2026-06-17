// Cabecera de sección reutilizable (título + introducción) sobre fondo azul.
export function PageHeader({
  title,
  intro,
}: {
  title: string;
  intro?: string;
}) {
  return (
    <section className="relative bg-azul-800 text-white">
      <div className="container py-12 md:py-16">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-3 max-w-2xl text-azul-100">{intro}</p>}
      </div>
      <div className="h-1 w-full bg-dorado" />
    </section>
  );
}
