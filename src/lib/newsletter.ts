import { Resend } from "resend";

/**
 * Alta en el boletín de noticias (Resend). Lanza si Resend no está
 * configurado o si falla la llamada — quien la invoque decide si eso debe
 * bloquear la operación (el formulario público) o ser un fallo silencioso
 * (el alta de socios, donde no debe impedir la creación del socio).
 */
export async function suscribirNewsletter(email: string, nombre?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    throw new Error("Newsletter no configurada.");
  }
  const resend = new Resend(apiKey);
  await resend.contacts.create({ audienceId, email, firstName: nombre, unsubscribed: false });
}
