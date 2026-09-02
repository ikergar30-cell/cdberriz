import { normaliza } from "@/lib/texto";

// Antiguamente, cuando un hijo/a empezaba a jugar, se daba de alta a sus dos
// padres/madres como socios seguidos... y en no pocos casos, al segundo se
// le copió el nombre del primero en vez del suyo propio. Se detecta así: dos
// socios con número correlativo y exactamente el mismo nombre — no se
// corrige solo (podría ser el nombre bueno del segundo, no lo sabemos),
// pero se avisa para que alguien del club lo revise a mano.
export function idsNombreARevisar<T extends { id: string; numero_socio: number; nombre: string; apellidos: string }>(
  socios: T[],
): Set<string> {
  const ordenado = [...socios].sort((a, b) => a.numero_socio - b.numero_socio);
  const marcados = new Set<string>();
  for (let i = 0; i < ordenado.length - 1; i++) {
    const a = ordenado[i];
    const b = ordenado[i + 1];
    if (b.numero_socio !== a.numero_socio + 1) continue;
    const nombreA = normaliza(`${a.nombre} ${a.apellidos}`);
    const nombreB = normaliza(`${b.nombre} ${b.apellidos}`);
    if (nombreA && nombreA === nombreB) {
      marcados.add(a.id);
      marcados.add(b.id);
    }
  }
  return marcados;
}
