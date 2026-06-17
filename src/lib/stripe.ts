// Cliente de Stripe — SOLO servidor. Nunca importar en componentes de navegador.
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  appInfo: { name: "C.D. Berriz" },
});
