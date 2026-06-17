"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio } from "@/lib/supabase/types";

// Lee y normaliza los campos del formulario de socio.
function leerCampos(formData: FormData) {
  const txt = (k: string) => {
    const v = formData.get(k);
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  };

  const familia = (txt("miembros_familia") || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((nombre) => ({ nombre }));

  return {
    nombre: txt("nombre") ?? "",
    apellidos: txt("apellidos") ?? "",
    email: txt("email"),
    telefono: txt("telefono"),
    dni: txt("dni"),
    direccion: txt("direccion"),
    fecha_nacimiento: txt("fecha_nacimiento"),
    tipo_abono_id: txt("tipo_abono_id"),
    estado: (txt("estado") ?? "pendiente") as EstadoSocio,
    fecha_alta: txt("fecha_alta"),
    notas: txt("notas"),
    miembros_familia: familia,
  };
}

export async function crearSocio(formData: FormData) {
  const supabase = createClient();
  const datos = leerCampos(formData);

  if (!datos.nombre || !datos.apellidos) {
    throw new Error("Nombre y apellidos son obligatorios.");
  }

  // RLS exige que sea un empleado autenticado; si no, falla aquí.
  const { error } = await supabase.from("socios").insert(datos);
  if (error) throw new Error("No se pudo crear el socio: " + error.message);

  revalidatePath("/admin/socios");
  redirect("/admin/socios");
}

export async function actualizarSocio(id: string, formData: FormData) {
  const supabase = createClient();
  const datos = leerCampos(formData);

  if (!datos.nombre || !datos.apellidos) {
    throw new Error("Nombre y apellidos son obligatorios.");
  }

  const { error } = await supabase.from("socios").update(datos).eq("id", id);
  if (error) throw new Error("No se pudo actualizar: " + error.message);

  revalidatePath("/admin/socios");
  revalidatePath(`/admin/socios/${id}`);
  redirect("/admin/socios");
}

export async function eliminarSocio(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("socios").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar: " + error.message);

  revalidatePath("/admin/socios");
  redirect("/admin/socios");
}
