// Reglas de edad de las cuotas del club.
//   - Joven: válido hasta 25 años INCLUIDO. A partir de 26 → Individual.
//   - Jubilado: válido desde 65 años INCLUIDO. Si es menor → Individual.
//   - Individual y Familiar: sin límite de edad.

export function calcularEdad(fechaNacimiento: string, ref = new Date()): number {
  const n = new Date(fechaNacimiento);
  let edad = ref.getFullYear() - n.getFullYear();
  const m = ref.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < n.getDate())) edad--;
  return edad;
}

// Devuelve la clave de cuota que REALMENTE corresponde según la edad.
// Si la elegida no es válida para su edad, la corrige a "individual".
export function cuotaEfectiva(
  claveElegida: string,
  fechaNacimiento: string | null | undefined,
  ref = new Date(),
): string {
  if (!fechaNacimiento) return claveElegida;
  const edad = calcularEdad(fechaNacimiento, ref);
  if (claveElegida === "joven" && edad > 25) return "individual";
  if (claveElegida === "jubilado" && edad < 65) return "individual";
  return claveElegida;
}
