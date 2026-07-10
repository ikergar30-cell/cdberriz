"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
export async function marcarCarnetListo(id: string) {
  await exigirEmpleado();
  const admin = createAdminClient();

  const { data: socio, error: errSocio } = await admin
    .from("socios")
    .select("nombre, apellidos, email, numero_socio, carnet_fisico_entregado_en")
    .eq("id", id)
    .single();
  if (errSocio || !socio) throw new Error("Socio no encontrado.");
  if (socio.carnet_fisico_entregado_en) {
    throw new Error("Este carné ya estaba marcado como listo.");
  }

  const ahora = new Date().toISOString();
  const { error } = await admin
    .from("socios")
    .update({ carnet_fisico_entregado_en: ahora })
    .eq("id", id);
  if (error) throw new Error(error.message);

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
      const from = process.env.CONTACT_FROM || "C.D. Berriz <onboarding@resend.dev>";
      await resend.emails.send({
        from,
        to: socio.email,
        subject: "Tu carné físico ya está listo para recoger",
        text:
          `Hola ${socio.nombre},\n\n` +
          `Tu carné físico de socio/a (nº ${socio.numero_socio}) ya está listo para que ` +
          `pases a recogerlo por Berrizburu Futbol Zelaia.\n\n` +
          `Un saludo,\nC.D. Berriz`,
      });
    } catch {
      /* el aviso es informativo, no bloquea la marca como listo */
    }
  }

  revalidatePath("/admin/socios/carnets");
  revalidatePath("/admin");
}
