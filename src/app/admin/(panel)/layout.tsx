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
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Image src="/escudo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-display text-sm font-extrabold uppercase text-azul-700">
              C.D. Berriz
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">{perfil.nombre}</span>
            <LogoutButton />
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
    { titulo: null, items: [{ href: "/admin", label: "Resumen" }, { href: "/admin/tickets", label: "Buzón de contacto" }] },
    {
      titulo: "Socios",
      items: [
        { href: "/admin/socios", label: "Socios" },
        { href: "/admin/cuotas", label: "Cuotas" },
        { href: "/admin/socios/carnets", label: "Carnés físicos" },
        { href: "/admin/verificar", label: "Verificar carné" },
        { href: "/admin/socios/asistencia", label: "Asistencia" },
      ],
    },
    {
      titulo: "Contenido",
      items: [
        { href: "/studio/intent/create/type=noticia", label: "Publicar noticia", externo: true },
        { href: "/studio/intent/create/type=evento", label: "Publicar evento", externo: true },
        { href: "/studio", label: "Gestor de contenidos", externo: true },
      ],
    },
    {
      titulo: "Resguardos",
      items: [
        { href: "/admin/resguardos/arbitros", label: "Árbitros" },
        { href: "/admin/resguardos/entrenadores", label: "Entrenadores" },
      ],
    },
    ...(esAdmin
      ? [
          {
            titulo: "Finanzas",
            items: [{ href: "/admin/finanzas", label: "Informe Stripe" }],
          },
          {
            titulo: "Administración",
            items: [{ href: "/admin/empleados", label: "Empleados" }],
          },
        ]
      : []),
  ];

  return (
    // En escritorio la altura queda fija a la ventana y solo el contenido
    // central hace scroll, para que la barra lateral se quede anclada. En
    // móvil (sidebar oculta, cabecera "sticky") el scroll es el normal de la
    // página.
    <div className="flex min-h-screen flex-col bg-neutral-50 md:h-screen md:flex-row md:overflow-hidden">
      <NavPanel
        secciones={secciones}
        nombre={perfil.nombre}
        esAdmin={esAdmin}
        logout={<LogoutButton variante="oscuro" />}
      />
      <main className="flex-1 overflow-x-auto md:overflow-y-auto">{children}</main>
    </div>
  );
}
