import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { esClaveCuota } from "@/config/cuotas";
import { cuotaEfectiva, calcularEdad } from "@/lib/edad";
import { esDniValido, normalizarDni } from "@/lib/dni";

// Inicia el alta de un socio: crea el cliente en Stripe y una sesión de Checkout
// (suscripción anual, tarjeta o SEPA). El socio se crea en nuestra base de datos
// DESPUÉS, cuando Stripe confirma el pago (ver /api/stripe/webhook).
//
// Seguridad: no se confía en importes del cliente; el precio se toma de Stripe
// (tipos_abono.stripe_price_id). El email se valida. No se expone ninguna clave.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const clave = String(body.clave ?? "");
  const nombre = String(body.nombre ?? "").trim();
  const apellidos = String(body.apellidos ?? "").trim();
  const email = String(body.email ?? "").trim();
  const telefono = String(body.telefono ?? "").trim();
  const direccion = String(body.direccion ?? "").trim();
  const poblacion = String(body.poblacion ?? "").trim();
  const codigoPostal = String(body.codigo_postal ?? "").trim();
  const dni = normalizarDni(String(body.dni ?? ""));
  const fechaNacimiento = String(body.fecha_nacimiento ?? "").trim();
  const locale = body.locale === "eu" ? "eu" : "es";

  // Validaciones básicas: todos los campos son obligatorios.
  if (!esClaveCuota(clave)) {
    return NextResponse.json({ error: "Cuota no válida" }, { status: 400 });
  }
  if (!nombre || !apellidos) {
    return NextResponse.json({ error: "Faltan nombre y apellidos" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }
  if (!telefono) {
    return NextResponse.json({ error: "Falta el teléfono" }, { status: 400 });
  }
  if (!esDniValido(dni)) {
    return NextResponse.json({ error: "DNI / NIE no válido" }, { status: 400 });
  }
  if (!direccion) {
    return NextResponse.json({ error: "Falta la dirección" }, { status: 400 });
  }
  if (!poblacion) {
    return NextResponse.json({ error: "Falta la población" }, { status: 400 });
  }
  if (!/^\d{5}$/.test(codigoPostal)) {
    return NextResponse.json({ error: "Código postal no válido" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    return NextResponse.json({ error: "Falta la fecha de nacimiento" }, { status: 400 });
  }

  // Cuota que REALMENTE corresponde por edad (no nos fiamos del cliente):
  // un joven mayor de 25 o un "jubilado" menor de 65 pasan a Individual.
  const claveFinal = cuotaEfectiva(clave, fechaNacimiento);

  // Abono familiar: incluye dos carnets, así que se validan también los
  // datos mínimos del segundo titular.
  const nombre2 = String(body.nombre2 ?? "").trim();
  const apellidos2 = String(body.apellidos2 ?? "").trim();
  const dni2 = normalizarDni(String(body.dni2 ?? ""));
  const fechaNacimiento2 = String(body.fecha_nacimiento2 ?? "").trim();
  // Opcional: si el segundo titular quiere su propio acceso al portal de
  // socios (con su carné digital), necesita un email distinto al del titular.
  const email2 = String(body.email2 ?? "").trim();
  if (claveFinal === "familiar") {
    if (!nombre2 || !apellidos2) {
      return NextResponse.json(
        { error: "Faltan nombre y apellidos del segundo titular" },
        { status: 400 },
      );
    }
    if (!esDniValido(dni2)) {
      return NextResponse.json(
        { error: "DNI / NIE del segundo titular no válido" },
        { status: 400 },
      );
    }
    if (dni2 === dni) {
      return NextResponse.json(
        { error: "El segundo titular no puede tener el mismo DNI" },
        { status: 400 },
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento2)) {
      return NextResponse.json(
        { error: "Falta la fecha de nacimiento del segundo titular" },
        { status: 400 },
      );
    }
    if (email2 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email2)) {
      return NextResponse.json(
        { error: "El email del segundo titular no es válido" },
        { status: 400 },
      );
    }
    if (email2 && email2.toLowerCase() === email.toLowerCase()) {
      return NextResponse.json(
        { error: "El segundo titular no puede usar el mismo email que el titular" },
        { status: 400 },
      );
    }
  }

  // Ser socio implica un contrato con pago recurrente: un menor no puede
  // contraerlo por sí solo, y el uso de su imagen (LO 1/1996) exige el
  // consentimiento expreso de su padre/madre/tutor legal.
  const hayMenor =
    calcularEdad(fechaNacimiento) < 18 ||
    (claveFinal === "familiar" && calcularEdad(fechaNacimiento2) < 18);
  if (hayMenor && body.autoriza_tutor !== "on") {
    return NextResponse.json(
      { error: "Falta la autorización del padre/madre/tutor legal del menor" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Precio real desde nuestra base de datos (enlazado a Stripe).
  const { data: cuota, error } = await admin
    .from("tipos_abono")
    .select("id, stripe_price_id, nombre")
    .eq("clave", claveFinal)
    .single();
  if (error || !cuota?.stripe_price_id) {
    return NextResponse.json(
      { error: "Esta cuota aún no está disponible para pago online" },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Cliente en Stripe con los datos del socio (los recupera el webhook).
  const meta: Record<string, string> = {
    nombre,
    apellidos,
    telefono,
    direccion,
    poblacion,
    codigo_postal: codigoPostal,
    dni,
    tipo_abono_id: cuota.id,
    clave: claveFinal,
    fecha_nacimiento: fechaNacimiento,
  };
  // Segundo titular del abono familiar (el webhook crea su carnet).
  if (claveFinal === "familiar") {
    meta.nombre2 = nombre2;
    meta.apellidos2 = apellidos2;
    meta.dni2 = dni2;
    meta.fecha_nacimiento2 = fechaNacimiento2;
    if (email2) meta.email2 = email2;
  }

  const customer = await stripe.customers.create({
    email,
    name: `${nombre} ${apellidos}`,
    phone: telefono || undefined,
    metadata: meta,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: cuota.stripe_price_id, quantity: 1 }],
    // Tarjeta (confirmación inmediata) o domiciliación SEPA (Stripe recoge el
    // IBAN y el mandato directamente en su página; el cobro tarda unos días
    // en confirmarse, por eso el webhook no activa al socio hasta "invoice.paid").
    payment_method_types: ["card", "sepa_debit"],
    locale: locale === "eu" ? "auto" : "es",
    subscription_data: { metadata: meta },
    success_url: `${siteUrl}/${locale}/socios/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/${locale}/socios`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
