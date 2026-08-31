import type { Metadata, Viewport } from "next";
import "../globals.css";

// Layout raíz del panel de empleados. No usa el header/footer público ni los
// idiomas es/eu (es una herramienta interna en castellano). No se indexa.
//
// PWA: mismo manifest que /intranet (ver ese layout) para que también se
// pueda instalar entrando directamente en /admin (p. ej. el verificador que
// entra a /admin/verificar en vez de por el hub de /intranet).
export const metadata: Metadata = {
  title: "C.D. Berriz · Gestión",
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
