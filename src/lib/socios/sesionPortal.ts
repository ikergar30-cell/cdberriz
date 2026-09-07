import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cookie donde se recuerda, cuando varias personas comparten el mismo email,
// cuál de sus fichas está usando esta persona en el portal.
export const COOKIE_FICHA_PORTAL = "cdb_ficha_portal";

export type FichaPortal = {
  id: string;
  numero_socio: number;
  nombre: string;
  apellidos: string;
};

export type ResolucionPortal =
  | { tipo: "sin_sesion" }
  | { tipo: "sin_socio" }
  | { tipo: "elegir"; opciones: FichaPortal[] }
  | { tipo: "ok"; socioId: string; email: string; opciones: FichaPortal[] };

// Localiza qué ficha(s) de socio corresponden al email de la sesión y, si hay
// varias personas con el mismo correo, cuál está usando esta persona. Es el
// ÚNICO sitio donde se resuelve la identidad del socio en el portal (antes
// estaba copiado en cuatro sitios, con diferencias entre ellos).
//
// Arregla el fallo de identificación por email compartido:
//  - Coincidencia EXACTA del email (comparando en minúsculas), NUNCA por
//    patrón. Antes se usaba `.ilike(email)` con el email de la sesión como
//    patrón, así que un "_" o un "%" en él actuaba como comodín y podía
//    emparejar con la ficha de otra persona. El `.ilike` de aquí es solo un
//    filtro grueso; la igualdad exacta se comprueba después en memoria.
//  - Si el correo lo comparten varias fichas (matrimonios, 2º carné familiar,
//    padre y madre socios "por hijo/a"…) NO se coge la del número más bajo a
//    ciegas: se le pide a la persona que diga quién es, y su elección se
//    recuerda en la cookie mientras siga siendo válida.
//  - Nunca se usa un id que venga del cliente sin comprobar que está entre las
//    fichas que de verdad comparten el email de la sesión.
export async function resolverPortal(): Promise<ResolucionPortal> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { tipo: "sin_sesion" };

  const email = user.email.toLowerCase();
  const admin = createAdminClient();
  const { data } = await admin
    .from("socios")
    .select("id, numero_socio, nombre, apellidos, email")
    .ilike("email", user.email) // filtro grueso, insensible a mayúsculas
    .order("numero_socio", { ascending: true });

  // Igualdad EXACTA: el `.ilike` puede sobre-emparejar si el email tiene "_"/"%".
  const opciones: FichaPortal[] = (data ?? [])
    .filter((s) => (s.email ?? "").toLowerCase() === email)
    .map((s) => ({
      id: s.id,
      numero_socio: s.numero_socio,
      nombre: s.nombre,
      apellidos: s.apellidos,
    }));

  if (opciones.length === 0) return { tipo: "sin_socio" };
  if (opciones.length === 1) {
    return { tipo: "ok", socioId: opciones[0].id, email, opciones };
  }

  // Varias personas con el mismo correo: usamos la ficha que haya elegido, si
  // esa elección sigue siendo válida (sigue estando entre las coincidencias).
  const elegido = cookies().get(COOKIE_FICHA_PORTAL)?.value;
  if (elegido && opciones.some((o) => o.id === elegido)) {
    return { tipo: "ok", socioId: elegido, email, opciones };
  }
  return { tipo: "elegir", opciones };
}
