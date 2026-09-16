"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { club } from "@/config/club";
import type { RolEmpleado } from "@/lib/supabase/types";

// Busca un usuario de auth por email (paginado). Devuelve el usuario o null.
async function buscarUsuarioAuth(correo: string) {
  const admin = createAdminClient();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    const u = data.users.find((x) => (x.email ?? "").toLowerCase() === correo);
    if (u) return u;
    if (data.users.length < 1000) break;
  }
  return null;
}

// Envía por RESEND (no por el correo de Supabase, que no está configurado) un
// enlace para que el empleado establezca su contraseña de acceso al panel.
// Genera un token de recuperación con la API admin y lo manda nosotros mismos.
async function enviarEnlaceContrasena(email: string, nombre: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const hashedToken = link?.properties?.hashed_token;
  if (error || !hashedToken) return { ok: false, error: "No se pudo generar el enlace de acceso." };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "El envío de email no está configurado." };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${siteUrl}/auth/callback?token_hash=${hashedToken}&type=recovery`;
  try {
    const resend = new Resend(apiKey);
    const from = process.env.CONTACT_FROM || club.remitente;
    await resend.emails.send({
      from,
      to: email,
      subject: "Acceso al panel de C.D. Berriz",
      text:
        `Hola ${nombre}:\n\n` +
        `Te han creado una cuenta para el panel de gestión de C.D. Berriz.\n\n` +
        `Pulsa este enlace para establecer tu contraseña:\n${url}\n\n` +
        `Después podrás entrar en ${siteUrl}/admin con tu email y esa contraseña.\n\n` +
        `Un saludo,\nC.D. Berriz`,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar el email de acceso." };
  }
}

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

  // Crear el usuario en Auth (contraseña aleatoria, email confirmado). Si ese
  // email YA existe en Auth (p. ej. la persona es socia y se registró en el
  // portal), se reutiliza su usuario en lugar de fallar.
  let userId: string;
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (authData?.user) {
    userId = authData.user.id;
  } else if (/registered|exists|already/i.test(authError?.message ?? "")) {
    const existente = await buscarUsuarioAuth(email);
    if (!existente) {
      redirect("/admin/empleados?error=" + encodeURIComponent("Ese email ya existe pero no se ha podido localizar. Inténtalo de nuevo."));
    }
    userId = existente.id;
  } else {
    redirect("/admin/empleados?error=" + encodeURIComponent(authError?.message ?? "Error al crear el usuario."));
  }

  // ¿Ya tiene perfil de empleado? No duplicar.
  const { data: yaPerfil } = await admin.from("perfiles").select("id").eq("id", userId).maybeSingle();
  if (yaPerfil) {
    redirect("/admin/empleados?error=" + encodeURIComponent("Esta persona ya es empleada del panel."));
  }

  const { error: perfilError } = await admin
    .from("perfiles")
    .insert({ id: userId, nombre, email, rol });
  if (perfilError) {
    // Si acabábamos de crear el usuario y falló el perfil, lo limpiamos.
    if (authData?.user) await admin.auth.admin.deleteUser(userId);
    redirect("/admin/empleados?error=" + encodeURIComponent(perfilError.message));
  }

  // El rol "verificador" entra sin contraseña (email + PIN de taquilla). Al
  // resto se le envía por Resend un enlace para establecer su contraseña.
  if (rol !== "verificador") {
    const r = await enviarEnlaceContrasena(email, nombre);
    if (!r.ok) {
      redirect(
        "/admin/empleados?error=" +
          encodeURIComponent(`Empleado creado, pero no se pudo enviar el email de acceso (${r.error ?? ""}). Usa "Reenviar enlace".`),
      );
    }
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

  // El nombre para personalizar el email (si lo tenemos).
  const admin = createAdminClient();
  const { data: perfilDestino } = await admin
    .from("perfiles")
    .select("nombre")
    .eq("email", email)
    .maybeSingle();

  const r = await enviarEnlaceContrasena(email, perfilDestino?.nombre ?? "");
  if (!r.ok) {
    redirect("/admin/empleados?error=" + encodeURIComponent(r.error ?? "No se pudo reenviar el enlace."));
  }

  redirect("/admin/empleados?ok=3");
}

export async function actualizarEmpleado(id: string, formData: FormData): Promise<void> {
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
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const rol = (formData.get("rol") as RolEmpleado | null) ?? "";

  if (!nombre || !email || !rol) {
    redirect("/admin/empleados?error=" + encodeURIComponent("Todos los campos son obligatorios."));
  }

  const admin = createAdminClient();

  // El email real de login vive en Auth (auth.users); el de "perfiles" es
  // solo un espejo para el login sin contraseña del rol "verificador". Hay
  // que mantener los dos sincronizados o dejarían de coincidir.
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
  });
  if (authError) {
    redirect("/admin/empleados?error=" + encodeURIComponent(authError.message));
  }

  const { error: perfilError } = await admin
    .from("perfiles")
    .update({ nombre, email, rol })
    .eq("id", id);
  if (perfilError) {
    redirect("/admin/empleados?error=" + encodeURIComponent(perfilError.message));
  }

  redirect("/admin/empleados?ok=2");
}

export async function eliminarEmpleado(id: string): Promise<void> {
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

  if (id === user.id) {
    redirect("/admin/empleados?error=" + encodeURIComponent("No puedes eliminarte a ti mismo."));
  }

  // Borra el usuario de Auth; "perfiles" cae en cascada (ver schema.sql).
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    redirect("/admin/empleados?error=" + encodeURIComponent(error.message));
  }

  redirect("/admin/empleados?ok=4");
}
