import type { Metadata } from "next";
import "../globals.css";

// Layout raíz de la invitación temporal (carné de invitado). Pública, sin
// login: es lo que abre el invitado en su móvil para enseñarlo en la
// entrada. No usa idiomas ni header/footer públicos. No se indexa.
export const metadata: Metadata = {
  title: "C.D. Berriz · Invitación",
  robots: { index: false, follow: false },
};

export default function InvitacionRootLayout({
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
