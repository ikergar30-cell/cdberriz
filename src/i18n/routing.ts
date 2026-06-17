import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

// Configuración de idiomas de la web. Castellano por defecto, euskera disponible.
// Las URLs siempre llevan prefijo de idioma: /es/... y /eu/...
export const routing = defineRouting({
  locales: ["es", "eu"],
  defaultLocale: "es",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

// Navegación con conciencia de idioma (Link, redirect, router, etc.)
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
