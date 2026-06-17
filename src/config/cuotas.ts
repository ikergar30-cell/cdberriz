// Cuotas del club para mostrar en el alta (es/eu). El importe real que se cobra
// es el de Stripe (enlazado por clave en tipos_abono.stripe_price_id); esto es
// solo para presentación. Las claves coinciden con tipos_abono.clave.
export const CUOTAS = {
  joven: {
    nombre: { es: "Joven", eu: "Gaztea" },
    descripcion: { es: "Para menores de 25 años", eu: "25 urtetik beherakoentzat" },
    precio: 25,
  },
  individual: {
    nombre: { es: "Individual", eu: "Banakakoa" },
    descripcion: { es: "Abono individual", eu: "Banakako bazkidetza" },
    precio: 40,
  },
  familiar: {
    nombre: { es: "Familiar", eu: "Familiakoa" },
    descripcion: { es: "Para toda la familia", eu: "Familia osoarentzat" },
    precio: 60,
  },
  jubilado: {
    nombre: { es: "Jubilado/a", eu: "Erretiratua" },
    descripcion: { es: "Para personas jubiladas", eu: "Erretiratuentzat" },
    precio: 25,
  },
} as const;

export type ClaveCuota = keyof typeof CUOTAS;

export function esClaveCuota(v: string): v is ClaveCuota {
  return v in CUOTAS;
}
