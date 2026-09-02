import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import { NavPanel, type SeccionNav } from "./NavPanel";

// Layout del área protegida. Doble verificación (además del middleware y RLS):
// debe haber sesión Y el usuario debe ser un empleado registrado en "perfiles".
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .single();

  // Usuario logueado pero no autorizado como empleado → fuera.
  if (!perfil) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  // Layout simplificado para verificadores: solo header mínimo, sin sidebar.
  if (perfil.rol === "verificador") {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between bg-azul-900 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Image src="/escudo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <div>
              <p className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-white">
                C.D. Berriz
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-dorado-400">
                Control de acceso
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">{perfil.nombre}</span>
            <LogoutButton variante="oscuro" />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Navegación agrupada por áreas de trabajo. Finanzas y Administración
  // solo aparecen para el rol admin.
  const esAdmin = perfil.rol === "admin";
  const secciones: SeccionNav[] = [
    {
      titulo: null,
      items: [
        { href: "/admin", label: "Resumen", icono: "resumen" },
        { href: "/admin/tickets", label: "Buzón de contacto", icono: "buzon" },
      ],
    },
    {
      titulo: "Socios",
      items: [
        { href: "/admin/socios", label: "Socios", icono: "socios" },
        { href: "/admin/familias", label: "Familias / Jugadores", icono: "familias" },
        { href: "/admin/cuotas", label: "Cuotas", icono: "cuotas" },
      ],
    },
    {
      titulo: "Control de acceso",
      items: [
        { href: "/admin/verificar", label: "Verificar carné", icono: "verificar" },
        { href: "/admin/socios/carnets", label: "Carnés físicos", icono: "carnets" },
        { href: "/admin/socios/asistencia", label: "Asistencia", icono: "asistencia" },
        { href: "/admin/invitados", label: "Invitados", icono: "invitados" },
      ],
    },
    {
      titulo: "Contenido",
      items: [
        { href: "/studio/intent/create/type=noticia", label: "Publicar noticia", externo: true, icono: "noticia" },
        { href: "/studio/intent/create/type=evento", label: "Publicar evento", externo: true, icono: "evento" },
        { href: "/studio", label: "Gestor de contenidos", externo: true, icono: "studio" },
      ],
    },
    {
      titulo: "Resguardos",
      items: [
        { href: "/admin/resguardos/arbitros", label: "Árbitros", icono: "arbitros" },
        { href: "/admin/resguardos/entrenadores", label: "Entrenadores", icono: "entrenadores" },
      ],
    },
    ...(esAdmin
      ? [
          {
            titulo: "Finanzas",
            items: [{ href: "/admin/finanzas", label: "Informe Stripe", icono: "finanzas" as const }],
          },
          {
            titulo: "Administración",
            items: [{ href: "/admin/empleados", label: "Empleados", icono: "empleados" as const }],
          },
        ]
      : []),
  ];

  return (
    // En escritorio la altura queda fija a la ventana y solo el contenido
    // central hace scroll, para que la barra lateral se quede anclada. En
    // móvil (sidebar oculta, cabecera "sticky") el scroll es el normal de la
    // página.
    <div className="flex min-h-screen flex-col bg-neutral-100 md:h-screen md:flex-row md:overflow-hidden">
      <NavPanel
        secciones={secciones}
        nombre={perfil.nombre}
        esAdmin={esAdmin}
        logout={<LogoutButton variante="oscuro" />}
      />
      {/* "min-w-0" es imprescindible: sin él, un hijo ancho (una tabla) estira
          este contenedor flexible y quien se desplaza en horizontal es la
          página entera en vez de la propia tabla. */}
      <main className="min-w-0 flex-1 md:overflow-y-auto md:p-2.5">
        {/* El contenido va sobre una "hoja" blanca redondeada: separa
            visualmente la navegación del trabajo y da aire al panel. */}
        <div className="min-h-full bg-white md:rounded-2xl md:shadow-[0_1px_3px_rgba(10,47,77,0.06),0_8px_24px_-12px_rgba(10,47,77,0.12)]">
          {children}
        </div>
      </main>
    </div>
  );
}
