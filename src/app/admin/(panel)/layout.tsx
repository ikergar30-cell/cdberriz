import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

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

  // Nav completo para admin y empleado.
  const nav = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/socios", label: "Socios" },
    { href: "/admin/cuotas", label: "Cuotas" },
    { href: "/admin/verificar", label: "Verificar carné" },
    ...(perfil.rol === "admin"
      ? [
          { href: "/admin/empleados", label: "Empleados" },
          { href: "https://cdberriz.vercel.app/studio", label: "Studio →", target: "_blank" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      {/* Barra lateral */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-neutral-200 px-5 py-4">
          <Image src="/escudo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="font-display text-sm font-extrabold uppercase text-azul-700">
            Gestión
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              target={"target" in i ? i.target : undefined}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-azul"
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-3">
          <p className="px-3 pb-2 text-xs text-neutral-500">
            {perfil.nombre}
            {perfil.rol === "admin" && " · admin"}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
}
