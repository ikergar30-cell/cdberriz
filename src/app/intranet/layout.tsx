import type { Metadata, Viewport } from "next";
import "../globals.css";

// Layout raíz de la intranet de empleados. No usa idiomas ni header/footer
// públicos. No se indexa en buscadores.
//
// PWA: manifest propio (no el general del sitio) para que el personal pueda
// "Añadir a pantalla de inicio" y usarla como una app, con start_url en
// /intranet. appleWebApp es necesario aparte porque Safari/iOS todavía no
// lee bien el manifest para esto.
export const metadata: Metadata = {
  title: "C.D. Berriz · Intranet",
  robots: { index: false, follow: false },
  manifest: "/manifest-intranet.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CDB Intranet",
  },
  icons: {
    icon: [
      { url: "/icons/intranet-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/intranet-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/intranet-apple-touch.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2447",
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
