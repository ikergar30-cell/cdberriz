// Validación de DNI/NIE españoles, con letra de control incluida.
// DNI: 8 dígitos + letra. NIE: X/Y/Z + 7 dígitos + letra.

const LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";

/** Normaliza un DNI/NIE: quita puntos, guiones y espacios, y pasa a mayúsculas. */
export function normalizarDni(valor: string) {
  return valor.replace(/[.\-\s]/g, "").toUpperCase();
}

/** Comprueba formato Y letra de control de un DNI o NIE (admite puntos/guiones). */
export function esDniValido(valor: string) {
  const v = normalizarDni(valor);
  const m = v.match(/^([XYZ]?)(\d{7,8})([A-Z])$/);
  if (!m) return false;
  const [, nie, digitos, letra] = m;
  // NIE: 7 dígitos con prefijo; DNI: 8 dígitos sin prefijo.
  if (nie ? digitos.length !== 7 : digitos.length !== 8) return false;
  const numero = Number(`${nie ? "XYZ".indexOf(nie) : ""}${digitos}`);
  return LETRAS[numero % 23] === letra;
}
