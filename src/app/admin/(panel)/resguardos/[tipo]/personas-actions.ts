"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TipoPersonaPago } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actionResult";

type ResultadoSesion =
  | { ok: false; error: string }
  | { ok: true; supabase: ReturnType<typeof createClient> };

// Gestión del padrón de árbitros y entrenadores (nombre + DNI). Los pagos
// (resguardos) referencian a estas personas. RLS exige empleado; además
// verificamos la sesión aquí porque las server actions son invocables
// independientemente del renderizado de la página.
async function exigirEmpleado(): Promise<ResultadoSesion> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autorizado." };
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) return { ok: false, error: "No autorizado." };
  return { ok: true, supabase };
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

export async function crearPersona(tipo: TipoPersonaPago, formData: FormData): Promise<ActionResult> {
  const sesion = await exigirEmpleado();
  if (!sesion.ok) return { error: sesion.error };
  const { supabase } = sesion;

  const nombre = String(formData.get("nombre") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim().toUpperCase();

  if (!nombre || !dni) return { error: "Nombre y DNI son obligatorios." };

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
      return { error: "Ya existe una persona con ese DNI en esta lista." };
    }
    return { error: "No se pudo guardar: " + error.message };
  }

  revalidatePath(rutaTipo(tipo));
}

export async function actualizarPersona(
  id: string,
  tipo: TipoPersonaPago,
  formData: FormData,
): Promise<ActionResult> {
  const sesion = await exigirEmpleado();
  if (!sesion.ok) return { error: sesion.error };
  const { supabase } = sesion;

  const nombre = String(formData.get("nombre") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim().toUpperCase();

  if (!nombre || !dni) return { error: "Nombre y DNI son obligatorios." };

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
      return { error: "Ya existe una persona con ese DNI en esta lista." };
    }
    return { error: "No se pudo actualizar: " + error.message };
  }

  revalidatePath(rutaTipo(tipo));
}

export async function eliminarPersona(id: string, tipo: TipoPersonaPago): Promise<ActionResult> {
  const sesion = await exigirEmpleado();
  if (!sesion.ok) return { error: sesion.error };
  // Al borrar la persona se borran sus resguardos (on delete cascade).
  const { error } = await sesion.supabase.from("personas_pago").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar: " + error.message };

  revalidatePath(rutaTipo(tipo));
}
