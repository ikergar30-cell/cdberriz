"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { capitalizarPalabras } from "@/lib/texto";
import type { ActionResult } from "@/lib/actionResult";

async function exigirEmpleadoPleno() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || perfil.rol === "verificador") redirect("/admin");
}

function leerCampos(formData: FormData) {
  const txt = (k: string) => {
    const v = formData.get(k);
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  };
  return {
    nombre: capitalizarPalabras(txt("nombre") ?? ""),
    apellidos: txt("apellidos") ? capitalizarPalabras(txt("apellidos")!) : null,
    equipo: txt("equipo"),
    temporada: txt("temporada"),
    fecha_nacimiento: txt("fecha_nacimiento"),
    madre_socio_id: txt("madre_socio_id"),
    padre_socio_id: txt("padre_socio_id"),
  };
}

export async function crearJugador(formData: FormData): Promise<ActionResult> {
  await exigirEmpleadoPleno();
  const datos = leerCampos(formData);
  if (!datos.nombre) return { error: "El nombre es obligatorio." };
  if (!datos.madre_socio_id && !datos.padre_socio_id) {
    return { error: "Vincula al menos un padre/madre socio." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("jugadores").insert(datos);
  if (error) return { error: "No se pudo crear: " + error.message };

  revalidatePath("/admin/familias");
  redirect("/admin/familias");
}

export async function actualizarJugador(id: string, formData: FormData): Promise<ActionResult> {
  await exigirEmpleadoPleno();
  const datos = leerCampos(formData);
  if (!datos.nombre) return { error: "El nombre es obligatorio." };
  if (!datos.madre_socio_id && !datos.padre_socio_id) {
    return { error: "Vincula al menos un padre/madre socio." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("jugadores").update(datos).eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/admin/familias");
  redirect("/admin/familias");
}

export async function eliminarJugador(id: string): Promise<ActionResult> {
  await exigirEmpleadoPleno();
  const admin = createAdminClient();
  const { error } = await admin.from("jugadores").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar: " + error.message };

  revalidatePath("/admin/familias");
  redirect("/admin/familias");
}
