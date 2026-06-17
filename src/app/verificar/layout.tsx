import type { Metadata } from "next";
import "../globals.css";

// Layout raíz de la verificación de carnés (control de acceso del club).
// No usa idiomas ni header/footer públicos. No se indexa.
export const metadata: Metadata = {
  title: "C.D. Berriz · Verificar carné",
  robots: { index: false, follow: false },
};

export default function VerificarRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-neutral-100 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
