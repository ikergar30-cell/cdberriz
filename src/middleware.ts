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

  // Modo mantenimiento: bloquea todo el sitio público mientras se
  // traspasa el dominio. Se activa con la variable de entorno
  // MAINTENANCE_MODE=true en Vercel. /admin y /studio quedan libres
  // para poder seguir gestionando la web durante el traspaso.
  if (
    process.env.MAINTENANCE_MODE === "true" &&
    !pathname.startsWith("/studio")
  ) {
    return paginaMantenimiento();
  }

  // Resto del sitio público: gestión de idiomas es/eu.
  return intlMiddleware(request);
}

function paginaMantenimiento() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>C.D. Berriz — En mantenimiento</title>
<style>
  html,body{height:100%;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
  body{display:flex;align-items:center;justify-content:center;background:#0b2447;color:#fff;text-align:center;padding:24px;}
  .box{max-width:420px;}
  img{width:72px;height:72px;object-fit:contain;margin-bottom:16px;}
  h1{font-size:1.5rem;margin:0 0 8px;text-transform:uppercase;letter-spacing:.02em;}
  p{margin:0;font-size:.95rem;color:#c7d3e8;line-height:1.5;}
</style>
</head>
<body>
  <div class="box">
    <img src="/escudo.png" alt="C.D. Berriz" />
    <h1>Estamos actualizando la web</h1>
    <p>Volveremos a estar disponibles en breve. Gracias por tu paciencia.</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Retry-After": "3600",
    },
  });
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

  const { pathname } = request.nextUrl;
  const enLogin = pathname === "/admin/login" || pathname === "/admin/login-verificador";

  // Sin sesión y fuera del login → al login.
  if (!user && !enLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (!user) return response;

  // El rol "verificador" (usuario de la entrada, sin contraseña) SOLO puede
  // usar /admin/verificar: cualquier otra ruta del panel (incluido el login,
  // si ya tiene sesión) lo manda ahí. Es la aplicación real de la
  // restricción — la RLS de socios/pagos/tickets/etc. también la refuerza en
  // la base de datos (ver es_empleado_pleno() en supabase/schema.sql).
  if (pathname.startsWith("/admin") && pathname !== "/admin/verificar") {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .maybeSingle();

    if (perfil?.rol === "verificador") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/verificar";
      return NextResponse.redirect(url);
    }
  }

  // Con sesión y en el login → al panel.
  if (enLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Todas las rutas EXCEPTO: API, /auth (callback de login), Studio de Sanity,
  // intranet de empleados (hub público sin idioma), /invitacion (carné de
  // invitado, público sin idioma), internos de Next y archivos.
  matcher: ["/((?!api|auth|studio|intranet|invitacion|_next|_vercel|.*\\..*).*)"],
};
