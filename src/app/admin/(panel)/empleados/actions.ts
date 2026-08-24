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

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
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
    .insert({ id: authData.user.id, nombre, email, rol });

  if (perfilError) {
    // Intentar limpiar el usuario de Auth si falló el perfil.
    await admin.auth.admin.deleteUser(authData.user.id);
    redirect("/admin/empleados?error=" + encodeURIComponent(perfilError.message));
  }

  // El rol "verificador" no usa contraseña: entra solo con su email desde
  // /admin/login-verificador (ver esa ruta). Para el resto, enviamos el
  // email de "restablecer contraseña" para que la establezcan.
  //
  // OJO: admin.generateLink() NO envía ningún email (solo genera el enlace
  // para reenviarlo tú mismo con un proveedor propio); hay que usar
  // resetPasswordForEmail() del cliente normal, que sí dispara el correo
  // real de Supabase con la plantilla configurada.
  if (rol !== "verificador") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    });
  }

  redirect("/admin/empleados?ok=1");
}

export async function reenviarEnlace(email: string): Promise<void> {
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (error) {
    redirect("/admin/empleados?error=" + encodeURIComponent(error.message));
  }

  redirect("/admin/empleados?ok=3");
}

export async function renombrarEmpleado(id: string, formData: FormData): Promise<void> {
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

  const nombre = (formData.get("nombre") as string | null)?.trim() ?? "";
  if (!nombre) {
    redirect("/admin/empleados?error=" + encodeURIComponent("El nombre no puede estar vacío."));
  }

  const admin = createAdminClient();
  const { error } = await admin.from("perfiles").update({ nombre }).eq("id", id);
  if (error) {
    redirect("/admin/empleados?error=" + encodeURIComponent(error.message));
  }

  redirect("/admin/empleados?ok=2");
}
