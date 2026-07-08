"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TipoPersonaPago } from "@/lib/supabase/types";

// Gestión del padrón de árbitros y entrenadores (nombre + DNI). Los pagos
// (resguardos) referencian a estas personas. RLS exige empleado; además
// verificamos la sesión aquí porque las server actions son invocables
// independientemente del renderizado de la página.
async function exigirEmpleado() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) throw new Error("No autorizado");
  return supabase;
}

function rutaTipo(tipo: TipoPersonaPago) {
  return `/admin/resguardos/${tipo === "arbitro" ? "arbitros" : "entrenadores"}`;
}

// Convierte "375" o "375,50" (euros) a céntimos, o null si está vacío.
function parsearImporteCents(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export async function crearPersona(tipo: TipoPersonaPago, formData: FormData) {
  const supabase = await exigirEmpleado();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim().toUpperCase();

  if (!nombre || !dni) throw new Error("Nombre y DNI son obligatorios.");

  // Equipo e importe solo aplican a entrenadores.
  const extra =
    tipo === "entrenador"
      ? {
          equipo: String(formData.get("equipo") ?? "").trim() || null,
          importe_cents: parsearImporteCents(formData.get("importe")),
        }
      : {};

  const { error } = await supabase.from("personas_pago").insert({ nombre, dni, tipo, ...extra });
  if (error) {
    // El índice único (upper(dni), tipo) evita duplicar la misma persona.
    if (error.code === "23505") {
      throw new Error("Ya existe una persona con ese DNI en esta lista.");
    }
    throw new Error("No se pudo guardar: " + error.message);
  }

  revalidatePath(rutaTipo(tipo));
}

export async function actualizarPersona(
  id: string,
  tipo: TipoPersonaPago,
  formData: FormData,
) {
  const supabase = await exigirEmpleado();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim().toUpperCase();

  if (!nombre || !dni) throw new Error("Nombre y DNI son obligatorios.");

  const extra =
    tipo === "entrenador"
      ? {
          equipo: String(formData.get("equipo") ?? "").trim() || null,
          importe_cents: parsearImporteCents(formData.get("importe")),
        }
      : {};

  const { error } = await supabase
    .from("personas_pago")
    .update({ nombre, dni, ...extra })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una persona con ese DNI en esta lista.");
    }
    throw new Error("No se pudo actualizar: " + error.message);
  }

  revalidatePath(rutaTipo(tipo));
}

export async function eliminarPersona(id: string, tipo: TipoPersonaPago) {
  const supabase = await exigirEmpleado();
  // Al borrar la persona se borran sus resguardos (on delete cascade).
  const { error } = await supabase.from("personas_pago").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar: " + error.message);

  revalidatePath(rutaTipo(tipo));
}
