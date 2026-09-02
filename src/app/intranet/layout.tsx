import type { Metadata, Viewport } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "../globals.css";

// Mismas tipografías que la web pública y que el panel (ver admin/layout.tsx).
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

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
    <html lang="es" className={`${inter.variable} ${barlow.variable}`}>
      <body className="bg-neutral-100 font-sans text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
