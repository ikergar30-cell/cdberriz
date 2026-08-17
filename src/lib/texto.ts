// Normaliza texto libre (nombres, apellidos, poblaciones) para que en la
// base de datos siempre quede igual, sin importar cómo lo escriba cada
// persona (todo en mayúsculas, todo en minúsculas, etc.).

/** "PRUEBA APELLIDO" / "prueba apellido" -> "Prueba Apellido". */
export function capitalizarPalabras(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s-])([a-zà-ÿñ])/g, (_, sep, letra) => sep + letra.toUpperCase());
}

/**
 * Quita mayúsculas y tildes para comparar/buscar texto sin que importe cómo
 * lo haya escrito quien busca ("garcia" debe encontrar "García").
 */
export function normaliza(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
