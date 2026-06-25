import type { Metadata } from "next";
import "../globals.css";

// Layout raíz de la intranet de empleados. No usa idiomas ni header/footer
// públicos. No se indexa en buscadores.
export const metadata: Metadata = {
  title: "C.D. Berriz · Intranet",
  robots: { index: false, follow: false },
};

export default function IntranetRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
