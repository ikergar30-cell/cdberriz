import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverPortal } from "@/lib/socios/sesionPortal";

// Abre el portal de cliente de Stripe para que el socio gestione su cuota.
// Seguridad: exige sesión iniciada (enlace mágico) y resuelve SU ficha con
// resolverPortal() (coincidencia exacta de email + desambiguación si el correo
// lo comparten varias personas). Así nadie gestiona la cuota de otro.
export async function POST() {
  const portal = await resolverPortal();
  if (portal.tipo === "sin_sesion") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (portal.tipo === "elegir") {
    return NextResponse.json(
      { error: "Con este email hay varias fichas: elige la tuya en tu área de socio." },
      { status: 409 },
    );
  }
  if (portal.tipo !== "ok") {
    return NextResponse.json(
      { error: "No encontramos una cuota asociada a tu email" },
      { status: 404 },
    );
  }

  const admin = createAdminClient();
  const { data: socio } = await admin
    .from("socios")
    .select("stripe_customer_id")
    .eq("id", portal.socioId)
    .maybeSingle();

  if (!socio?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No encontramos una cuota asociada a tu email" },
      { status: 404 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const sesion = await stripe.billingPortal.sessions.create({
      customer: socio.stripe_customer_id,
      return_url: `${siteUrl}/`,
    });
    return NextResponse.json({ url: sesion.url });
  } catch {
    return NextResponse.json({ error: "No se pudo abrir el portal de pago." }, { status: 500 });
  }
}
