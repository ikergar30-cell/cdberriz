import type { OrigenSocio, Socio } from "@/lib/supabase/types";

// Campos que deberían estar rellenos, pero que socios antiguos o importados
// pueden tener vacíos. Se usa para avisar al personal en el listado y en la
// ficha. Es distinto según por qué es socio/a:
//  - "cuota" (paga): se le pidieron todos estos datos en el alta online, así
//    que si falta alguno es un hueco real que conviene rellenar.
//  - "jugador" (por hijo/a jugando, sin pagar cuota): nunca se le pidió
//    dirección/población/etc., así que exigirlo aquí solo generaría ruido
//    (con casi 400 socios así, sería el 100% "incompleto" y el aviso dejaría
//    de servir para nada). Lo único que de verdad hace falta es poder
//    identificarlo y, si se puede, contactarlo.
const CAMPOS_CUOTA: { clave: keyof Socio; etiqueta: string }[] = [
  { clave: "email", etiqueta: "Email" },
  { clave: "telefono", etiqueta: "Teléfono" },
  { clave: "dni", etiqueta: "DNI" },
  { clave: "direccion", etiqueta: "Dirección" },
  { clave: "poblacion", etiqueta: "Población" },
  { clave: "codigo_postal", etiqueta: "Código postal" },
  { clave: "fecha_nacimiento", etiqueta: "Fecha de nacimiento" },
];

type SocioParcial = Partial<
  Pick<Socio, "email" | "telefono" | "dni" | "direccion" | "poblacion" | "codigo_postal" | "fecha_nacimiento">
> & { origen?: OrigenSocio };

export function camposFaltantes(socio: SocioParcial): string[] {
  if (socio.origen === "jugador") {
    // Sin email NI DNI no hay forma de identificarlo ni de que entre a su
    // portal: eso sí es un hueco real. El resto de datos no le hacen falta.
    return !socio.email && !socio.dni ? ["Email o DNI"] : [];
  }
  return CAMPOS_CUOTA.filter((c) => !socio[c.clave as keyof typeof socio]).map((c) => c.etiqueta);
}
