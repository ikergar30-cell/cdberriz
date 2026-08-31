"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/actionResult";

async function exigirEmpleadoPleno() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || perfil.rol === "verificador") redirect("/admin");
  return user.id;
}

export async function crearInvitado(formData: FormData): Promise<void> {
  const empleadoId = await exigirEmpleadoPleno();

  const nombre = (formData.get("nombre") as string | null)?.trim() ?? "";
  const motivo = (formData.get("motivo") as string | null)?.trim() || null;
  const expiraStr = (formData.get("expira") as string | null) ?? "";
  const usosMaximos = Number(formData.get("usos_maximos") ?? 1);

  if (!nombre || !expiraStr) {
    redirect("/admin/invitados?error=" + encodeURIComponent("Nombre y fecha de caducidad son obligatorios."));
  }

  const expiraEn = new Date(expiraStr);
  if (Number.isNaN(expiraEn.getTime()) || expiraEn.getTime() <= Date.now()) {
    redirect("/admin/invitados?error=" + encodeURIComponent("La fecha de caducidad tiene que ser futura."));
  }
  if (!Number.isInteger(usosMaximos) || usosMaximos < 1) {
    redirect("/admin/invitados?error=" + encodeURIComponent("Los usos máximos tienen que ser al menos 1."));
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invitados")
    .insert({
      nombre,
      motivo,
      expira_en: expiraEn.toISOString(),
      usos_maximos: usosMaximos,
      creado_por: empleadoId,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/admin/invitados?error=" + encodeURIComponent(error?.message ?? "No se pudo crear la invitación."));
  }

  redirect(`/admin/invitados?creado=${data.id}`);
}

export async function revocarInvitado(id: string): Promise<ActionResult> {
  await exigirEmpleadoPleno();
  const admin = createAdminClient();

  const { error } = await admin
    .from("invitados")
    .update({ revocado_en: new Date().toISOString() })
    .eq("id", id)
    .is("revocado_en", null);
  if (error) return { error: error.message };

  revalidatePath("/admin/invitados");
}
