import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Abre el portal de cliente de Stripe para que el socio gestione su cuota.
// Seguridad: exige sesión iniciada (enlace mágico). Buscamos el socio por el
// email AUTENTICADO, no por uno que mande el cliente. Así nadie gestiona la
// cuota de otro.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // El socio puede no tener perfil de empleado; leemos con service_role,
  // pero SOLO su propia ficha (filtrada por su email autenticado).
  // .limit(1) en vez de .maybeSingle(): un email duplicado entre dos socios
  // (dato antiguo mal cargado) haría que .maybeSingle() lance un error y
  // deje a esa persona sin poder gestionar su cuota.
  const admin = createAdminClient();
  const { data: sociosCoincidentes } = await admin
    .from("socios")
    .select("stripe_customer_id")
    .ilike("email", user.email)
    .not("stripe_customer_id", "is", null)
    .limit(1);
  const socio = sociosCoincidentes?.[0];

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
