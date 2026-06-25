import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // El panel (/admin) y la verificación de carnés (/verificar) NO se
  // internacionalizan y van protegidos por login de empleado.
  if (pathname.startsWith("/admin") || pathname.startsWith("/verificar")) {
    return protegerAdmin(request);
  }

  // Resto del sitio público: gestión de idiomas es/eu.
  return intlMiddleware(request);
}

// Refresca la sesión de Supabase y exige login para entrar en /admin.
// La comprobación de que es un empleado autorizado se hace además en el layout
// de /admin y la refuerza RLS en la base de datos.
async function protegerAdmin(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const enLogin = request.nextUrl.pathname === "/admin/login";

  // Sin sesión y fuera del login → al login.
  if (!user && !enLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Con sesión y en el login → al panel.
  if (user && enLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Todas las rutas EXCEPTO: API, /auth (callback de login), Studio de Sanity,
  // intranet de empleados (hub público sin idioma), internos de Next y archivos.
  matcher: ["/((?!api|auth|studio|intranet|_next|_vercel|.*\\..*).*)"],
};
