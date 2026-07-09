// Política de reembolso de cuotas de socio: 14 días desde el pago (plazo legal
// de desistimiento en ventas a distancia, art. 71 LGDCU / RGPD). Pasado ese
// plazo, el club puede seguir reembolsando manualmente desde Stripe si lo
// considera oportuno, pero el panel ya no lo ofrece como acción automática.
export const REEMBOLSO_DIAS = 14;

/** Días transcurridos desde una fecha ISO hasta ahora (puede ser fraccionario). */
export function diasDesde(fechaISO: string): number {
  return (Date.now() - new Date(fechaISO).getTime()) / 86_400_000;
}
