"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RolEmpleado } from "@/lib/supabase/types";

export async function crearEmpleado(formData: FormData): Promise<void> {
  // Verificar que el usuario actual es admin.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.rol !== "admin") redirect("/admin");

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const nombre = (formData.get("nombre") as string | null)?.trim() ?? "";
  const rol = (formData.get("rol") as RolEmpleado | null) ?? "";

  if (!email || !nombre || !rol) {
    redirect("/admin/empleados?error=" + encodeURIComponent("Todos los campos son obligatorios."));
  }

  const admin = createAdminClient();

  // Crear usuario en Auth con contraseña aleatoria y confirmar email automáticamente.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? "Error al crear el usuario.";
    redirect("/admin/empleados?error=" + encodeURIComponent(msg));
  }

  // Insertar en la tabla de perfiles.
  const { error: perfilError } = await admin
    .from("perfiles")
    .insert({ id: authData.user.id, nombre, rol });

  if (perfilError) {
    // Intentar limpiar el usuario de Auth si falló el perfil.
    await admin.auth.admin.deleteUser(authData.user.id);
    redirect("/admin/empleados?error=" + encodeURIComponent(perfilError.message));
  }

  // Generar enlace de recuperación para que el empleado establezca su contraseña.
  await admin.auth.admin.generateLink({ type: "recovery", email });

  redirect("/admin/empleados?ok=1");
}
