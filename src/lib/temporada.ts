// La temporada del club va de julio a junio (arranca el 1 de julio, ver
// src/config/facturacion.ts). Se usa para agrupar históricos (carnés
// físicos, asistencia a partidos…) por temporada en vez de por año natural.
export function temporadaDe(fecha: Date | string) {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function temporadaActual() {
  return temporadaDe(new Date());
}

// Fechas de inicio (inclusive) y fin (exclusive) de la temporada que contiene
// `fecha` — de 1 de julio a 30 de junio.
export function limitesTemporada(fecha: Date = new Date()) {
  const y = fecha.getFullYear();
  const anioInicio = fecha.getMonth() >= 6 ? y : y - 1;
  return {
    inicio: new Date(anioInicio, 6, 1),
    fin: new Date(anioInicio + 1, 6, 1),
  };
}
