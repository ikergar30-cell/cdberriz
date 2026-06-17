import type { Metadata, Viewport } from "next";

// Layout raíz independiente para el Studio (no usa el header/footer de la web
// ni el sistema de idiomas). El Studio no debe indexarse en buscadores.
export const metadata: Metadata = {
  title: "C.D. Berriz · Studio",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
