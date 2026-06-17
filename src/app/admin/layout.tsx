import type { Metadata } from "next";
import "../globals.css";

// Layout raíz del panel de empleados. No usa el header/footer público ni los
// idiomas es/eu (es una herramienta interna en castellano). No se indexa.
export const metadata: Metadata = {
  title: "C.D. Berriz · Gestión",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
