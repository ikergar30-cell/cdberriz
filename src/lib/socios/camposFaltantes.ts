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

// --- Datos que el propio socio debe completar en SU portal ------------------
//
// Es un criterio distinto al de arriba (que sirve para avisar al personal en
// el listado): aquí el socio ya ha entrado a su área y le pedimos que rellene
// lo que falte ANTES de enseñarle el carné. Como ha entrado con un enlace
// mágico a su email, el email siempre está; lo que pedimos es identificarse
// (DNI) y poder contactarle (teléfono). A quien paga cuota le pedimos además
// los datos que hacen falta para el carné físico y la facturación; al socio
// "por hijo/a jugando" no se le agobia con dirección, población, etc.
export type CampoPortal =
  | "dni" | "telefono" | "direccion" | "poblacion" | "codigo_postal" | "fecha_nacimiento";

export function camposPortalRequeridos(origen: OrigenSocio): CampoPortal[] {
  const base: CampoPortal[] = ["dni", "telefono"];
  if (origen === "cuota") {
    return [...base, "direccion", "poblacion", "codigo_postal", "fecha_nacimiento"];
  }
  return base;
}

type SocioPortal = Partial<Record<CampoPortal, unknown>> & { origen: OrigenSocio };

// Subconjunto de los requeridos que el socio tiene todavía sin rellenar.
export function camposFaltantesPortal(socio: SocioPortal): CampoPortal[] {
  return camposPortalRequeridos(socio.origen).filter((c) => {
    const v = socio[c];
    return v === null || v === undefined || String(v).trim() === "";
  });
}
