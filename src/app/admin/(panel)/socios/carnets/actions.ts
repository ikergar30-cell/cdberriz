"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { club } from "@/config/club";
import type { ActionResult } from "@/lib/actionResult";

async function exigirEmpleado() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil) redirect("/admin/login");
}

// Marca el carné físico como listo para recoger en Berrizburu y avisa al
// socio por email. No es crítico si el email falla: la marca ya ha quedado
// guardada y se puede reintentar el aviso más adelante.
export async function marcarCarnetListo(id: string, mensaje: string): Promise<ActionResult> {
  await exigirEmpleado();
  const admin = createAdminClient();

  const recogida = mensaje.trim().slice(0, 500);
  if (!recogida) {
    return { error: "Escribe la fecha de recogida o un mensaje para el socio." };
  }

  const { data: socio, error: errSocio } = await admin
    .from("socios")
    .select("nombre, apellidos, email, numero_socio, carnet_fisico_entregado_en")
    .eq("id", id)
    .single();
  if (errSocio || !socio) return { error: "Socio no encontrado." };
  if (socio.carnet_fisico_entregado_en) {
    return { error: "Este carné ya estaba marcado como listo." };
  }

  const ahora = new Date().toISOString();
  const { error } = await admin
    .from("socios")
    .update({ carnet_fisico_entregado_en: ahora, carnet_fisico_recogida: recogida })
    .eq("id", id);
  if (error) return { error: error.message };

  // Cierra la solicitud pendiente en el histórico (la más reciente sin entregar).
  const { data: pendiente } = await admin
    .from("carnets_fisicos")
    .select("id")
    .eq("socio_id", id)
    .is("entregado_en", null)
    .order("solicitado_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pendiente) {
    await admin.from("carnets_fisicos").update({ entregado_en: ahora }).eq("id", pendiente.id);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && socio.email) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.CONTACT_FROM || club.remitente;
      // Bilingüe (eu + es): no guardamos el idioma del socio, así que lo
      // enviamos en los dos. El mensaje de recogida lo escribe el empleado.
      await resend.emails.send({
        from,
        to: socio.email,
        subject: "Zure bazkide-txartela prest dago / Tu carné de socio ya está listo",
        text:
          `[EUSKARAZ]\n` +
          `Kaixo ${socio.nombre}:\n\n` +
          `Zure bazkide-txartel fisikoa (${socio.numero_socio} zk.) prest dago.\n\n` +
          `${recogida}\n\n` +
          `Agur bero bat,\nC.D. Berriz\n\n` +
          `— — —\n\n` +
          `[EN CASTELLANO]\n` +
          `Hola ${socio.nombre}:\n\n` +
          `Tu carné físico de socio/a (nº ${socio.numero_socio}) ya está listo.\n\n` +
          `${recogida}\n\n` +
          `Un saludo,\nC.D. Berriz`,
      });
    } catch {
      /* el aviso es informativo, no bloquea la marca como listo */
    }
  }

  revalidatePath("/admin/socios/carnets");
  revalidatePath("/admin");
}

// Rechaza una solicitud de carné físico porque al socio le falta la foto (no
// se puede imprimir un carné sin foto). Avisa por email para que la suba y
// vuelva a pedirlo; la solicitud desaparece de "Pendientes" hasta entonces.
export async function rechazarCarnetSinFoto(id: string): Promise<ActionResult> {
  await exigirEmpleado();
  const admin = createAdminClient();

  const { data: socio, error: errSocio } = await admin
    .from("socios")
    .select("nombre, apellidos, email, numero_socio, foto_url, carnet_fisico_entregado_en")
    .eq("id", id)
    .single();
  if (errSocio || !socio) return { error: "Socio no encontrado." };
  if (socio.foto_url) return { error: "Este socio ya tiene foto subida; no hace falta rechazarlo." };
  if (socio.carnet_fisico_entregado_en) return { error: "Este carné ya está marcado como listo." };

  const { error } = await admin
    .from("socios")
    .update({ carnet_fisico_pedido_en: null })
    .eq("id", id);
  if (error) return { error: error.message };

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && socio.email) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.CONTACT_FROM || club.remitente;
      await resend.emails.send({
        from,
        to: socio.email,
        subject: "Falta tu foto para el carné / Argazkia falta zaizu karnetarako",
        text:
          `[EUSKARAZ]\n` +
          `Kaixo ${socio.nombre}:\n\n` +
          `Ezin izan dugu zure bazkide-txartel fisikoaren eskaera kudeatu, argazkia falta baitzaizu. ` +
          `Igo ezazu zure argazkia zure eremu pribatutik ("Karnet digitala" atalean) eta gero eska ezazu berriro karnet fisikoa.\n\n` +
          `Agur bero bat,\nC.D. Berriz\n\n` +
          `— — —\n\n` +
          `[EN CASTELLANO]\n` +
          `Hola ${socio.nombre}:\n\n` +
          `No hemos podido tramitar tu solicitud de carné físico (nº ${socio.numero_socio}) porque todavía ` +
          `no tienes una foto subida. Sube tu foto desde tu área privada (sección "Carné digital") y vuelve ` +
          `a solicitar el carné físico.\n\n` +
          `Un saludo,\nC.D. Berriz`,
      });
    } catch {
      /* el aviso es informativo, no bloquea el rechazo */
    }
  }

  revalidatePath("/admin/socios/carnets");
  revalidatePath("/admin");
}
