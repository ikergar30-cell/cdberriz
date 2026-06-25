import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { esClaveCuota } from "@/config/cuotas";
import { cuotaEfectiva } from "@/lib/edad";

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
  const dni = String(body.dni ?? "").trim();
  const fechaNacimiento = String(body.fecha_nacimiento ?? "").trim();
  const locale = body.locale === "eu" ? "eu" : "es";

  // Validaciones básicas.
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    return NextResponse.json({ error: "Falta la fecha de nacimiento" }, { status: 400 });
  }

  // Cuota que REALMENTE corresponde por edad (no nos fiamos del cliente):
  // un joven mayor de 25 o un "jubilado" menor de 65 pasan a Individual.
  const claveFinal = cuotaEfectiva(clave, fechaNacimiento);

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
  const meta = {
    nombre,
    apellidos,
    telefono,
    direccion,
    dni,
    tipo_abono_id: cuota.id,
    clave: claveFinal,
    fecha_nacimiento: fechaNacimiento,
  };

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
    payment_method_types: ["card"],
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
