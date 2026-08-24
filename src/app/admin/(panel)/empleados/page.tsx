import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RolEmpleado } from "@/lib/supabase/types";
import { crearEmpleado } from "./actions";
import { NombreEmpleado } from "./NombreEmpleado";

// Badge de color según rol.
function BadgeRol({ rol }: { rol: RolEmpleado }) {
  const estilos: Record<RolEmpleado, string> = {
    admin: "bg-blue-100 text-blue-700",
    empleado: "bg-green-100 text-green-700",
    verificador: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estilos[rol]}`}>
      {rol}
    </span>
  );
}

interface Props {
  searchParams: { error?: string; ok?: string };
}

export default async function EmpleadosPage({ searchParams }: Props) {
  // Solo admins.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: miPerfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!miPerfil || miPerfil.rol !== "admin") redirect("/admin");

  // Listar todos los empleados (requiere service_role para saltarse RLS de perfiles ajenos).
  const admin = createAdminClient();
  const { data: empleados } = await admin
    .from("perfiles")
    .select("id, nombre, email, rol, created_at")
    .order("created_at", { ascending: false });

  const errorMsg = searchParams.error;
  const okMsg = searchParams.ok;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
          Empleados
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestión de cuentas de acceso al panel de administración.
        </p>
      </div>

      {/* Mensajes de estado */}
      {errorMsg && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {okMsg === "1" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Empleado creado correctamente. Si su rol no es &quot;verificador&quot;, se le ha
          enviado un enlace para establecer la contraseña; el rol &quot;verificador&quot;
          entra sin contraseña desde /admin/login-verificador.
        </div>
      )}
      {okMsg === "2" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Nombre actualizado correctamente.
        </div>
      )}

      {/* Tabla de empleados */}
      <div className="mb-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Nombre</th>
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Email</th>
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Rol</th>
              <th className="px-5 py-3 text-left font-semibold text-neutral-600">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {empleados && empleados.length > 0 ? (
              empleados.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <NombreEmpleado id={e.id} nombre={e.nombre} />
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{e.email ?? "—"}</td>
                  <td className="px-5 py-3">
                    <BadgeRol rol={e.rol as RolEmpleado} />
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {new Date(e.created_at).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-neutral-400">
                  No hay empleados registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Formulario de alta */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-bold uppercase text-neutral-900">
          Nuevo empleado
        </h2>
        <form action={crearEmpleado} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className="text-sm font-semibold text-neutral-700">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              placeholder="Nombre completo"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-neutral-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="correo@ejemplo.com"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rol" className="text-sm font-semibold text-neutral-700">
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            >
              <option value="">Selecciona un rol…</option>
              <option value="admin">admin</option>
              <option value="empleado">empleado</option>
              <option value="verificador">verificador</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-full bg-azul px-5 py-2 text-sm font-semibold text-white transition hover:bg-azul-700"
            >
              Crear empleado
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-neutral-400">
          El empleado recibirá un enlace para establecer su contraseña.
        </p>
      </div>
    </div>
  );
}
