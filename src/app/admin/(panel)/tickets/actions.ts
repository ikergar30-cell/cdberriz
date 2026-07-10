"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { club } from "@/config/club";
import type { ActionResult } from "@/lib/actionResult";
import type { EstadoTicket } from "@/lib/supabase/types";

type ResultadoSesion =
  | { ok: false; error: string }
  | { ok: true; admin: ReturnType<typeof createAdminClient>; nombreEmpleado: string };

async function exigirEmpleado(): Promise<ResultadoSesion> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) redirect("/admin/login");

  return { ok: true, admin: createAdminClient(), nombreEmpleado: perfil.nombre };
}

// Responde al ticket: guarda la respuesta en el hilo, envía el email al
// remitente (desde no-responder@cdberriz.com, con reply-to a coordinación) y
// marca el ticket como "respondido".
export async function responderTicket(id: string, cuerpo: string): Promise<ActionResult> {
  const sesion = await exigirEmpleado();
  if (!sesion.ok) return { error: sesion.error };
  const { admin, nombreEmpleado } = sesion;

  const texto = cuerpo.trim();
  if (!texto) return { error: "Escribe una respuesta antes de enviar." };

  const { data: ticket, error: errTicket } = await admin
    .from("tickets")
    .select("email, nombre, asunto")
    .eq("id", id)
    .single();
  if (errTicket || !ticket) return { error: "Ticket no encontrado." };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "El envío de email no está configurado." };
  try {
    const resend = new Resend(apiKey);
    const from = process.env.CONTACT_FROM || club.remitente;
    const replyTo = process.env.CONTACT_EMAIL || "coordinacioncdberriz@gmail.com";
    await resend.emails.send({
      from,
      to: ticket.email,
      replyTo,
      subject: `Re: ${ticket.asunto || "Tu mensaje"} — C.D. Berriz`,
      text: `Hola ${ticket.nombre}:\n\n${texto}\n\n— C.D. Berriz`,
    });
  } catch {
    return { error: "No se pudo enviar el email de respuesta." };
  }

  const { error: errMensaje } = await admin
    .from("ticket_mensajes")
    .insert({ ticket_id: id, del_club: true, autor: nombreEmpleado, cuerpo: texto });
  if (errMensaje) return { error: errMensaje.message };

  const { error: errEstado } = await admin
    .from("tickets")
    .update({ estado: "respondido" })
    .eq("id", id);
  if (errEstado) return { error: errEstado.message };

  revalidatePath(`/admin/tickets/${id}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
}

export async function cambiarEstadoTicket(id: string, estado: EstadoTicket): Promise<ActionResult> {
  const sesion = await exigirEmpleado();
  if (!sesion.ok) return { error: sesion.error };

  const { error } = await sesion.admin.from("tickets").update({ estado }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/tickets/${id}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
}

export async function cambiarCategoriaTicket(id: string, categoria: string): Promise<ActionResult> {
  const sesion = await exigirEmpleado();
  if (!sesion.ok) return { error: sesion.error };

  const { error } = await sesion.admin.from("tickets").update({ categoria }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/tickets/${id}`);
  revalidatePath("/admin/tickets");
}

export async function archivarTicket(id: string, archivar: boolean): Promise<ActionResult> {
  const sesion = await exigirEmpleado();
  if (!sesion.ok) return { error: sesion.error };

  const { error } = await sesion.admin.from("tickets").update({ archivado: archivar }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/tickets/${id}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
}
