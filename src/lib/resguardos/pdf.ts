import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { TipoPersonaPago } from "@/lib/supabase/types";

// Genera los resguardos de pago (árbitros y entrenadores) replicando las
// plantillas oficiales del club: página A4 con DOS copias idénticas (una para
// el club y otra para la persona) separadas por una línea discontinua; cada
// copia a dos columnas (euskera | castellano) con el escudo en la cabecera.

export type DatosResguardo = {
  tipo: TipoPersonaPago;
  nombre: string;
  dni: string;
  importeCents: number;
  /** Árbitros: partido (texto libre). Entrenadores: mes en formato "YYYY-MM". */
  concepto: string;
  /** Fecha del partido (árbitros) o del pago (entrenadores), ISO "YYYY-MM-DD". */
  fecha: string;
};

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MESES_EU = [
  "urtarrila", "otsaila", "martxoa", "apirila", "maiatza", "ekaina",
  "uztaila", "abuztua", "iraila", "urria", "azaroa", "abendua",
];

// "€" es neutro entre euskera y castellano (la plantilla usa el mismo
// <<IMPORTE>> en ambas columnas).
function formatearImporte(cents: number) {
  return (
    (cents / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " €"
  );
}

function formatearFecha(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// "2026-06" → { es: "junio de 2026", eu: "2026ko ekaina" }
function mesBilingue(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const i = (m ?? 1) - 1;
  return { es: `${MESES_ES[i]} de ${y}`, eu: `${y}ko ${MESES_EU[i]}` };
}

// Parte un texto en líneas que caben en un ancho dado.
function partirLineas(texto: string, font: PDFFont, size: number, maxAncho: number) {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const candidata = actual ? `${actual} ${p}` : p;
    if (font.widthOfTextAtSize(candidata, size) <= maxAncho) {
      actual = candidata;
    } else {
      if (actual) lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

const A4 = { ancho: 595.28, alto: 841.89 };
const MARGEN = 48;
const HUECO_COLUMNAS = 28;
const CUERPO = 9.5;
const INTERLINEADO = 14;

type Fuentes = { normal: PDFFont; negrita: PDFFont };

// Dibuja una copia del resguardo. `yTop` es el borde superior de la copia.
// Devuelve la Y donde termina.
function dibujarCopia(
  page: PDFPage,
  datos: DatosResguardo,
  fuentes: Fuentes,
  yTop: number,
): number {
  const anchoCol = (A4.ancho - MARGEN * 2 - HUECO_COLUMNAS) / 2;
  const xEu = MARGEN;
  const xEs = MARGEN + anchoCol + HUECO_COLUMNAS;

  const importe = formatearImporte(datos.importeCents);
  const fecha = formatearFecha(datos.fecha);

  let conceptoEu: string;
  let conceptoEs: string;
  if (datos.tipo === "arbitro") {
    conceptoEu = `${datos.concepto} partiduan, epaile lanak egiteagaitik.`;
    conceptoEs = `en concepto de arbitraje del partido correspondiente ${datos.concepto}.`;
  } else {
    const mes = mesBilingue(datos.concepto);
    conceptoEu = `${mes.eu}ri dagokion kilometro ordainagaitik.`;
    conceptoEs = `en concepto de dietas correspondientes al mes de ${mes.es}.`;
  }

  const cuerpoEu =
    `${datos.nombre} e(k), N.A.N. ${datos.dni} izanik, IFK G-48309108 duen ` +
    `C.D. Berriz elkartetik ${importe} jaso ditu, ${conceptoEu}`;
  const cuerpoEs =
    `${datos.nombre} con D.N.I. ${datos.dni} ha recibido del C.D. Berriz, ` +
    `con N.I.F. G-48309108, la cantidad de ${importe} ${conceptoEs}`;

  const negro = rgb(0.1, 0.1, 0.1);

  const dibujarColumna = (x: number, cuerpo: string, fechaLinea: string) => {
    let y = yTop;
    for (const linea of partirLineas(cuerpo, fuentes.normal, CUERPO, anchoCol)) {
      page.drawText(linea, { x, y, size: CUERPO, font: fuentes.normal, color: negro });
      y -= INTERLINEADO;
    }
    y -= INTERLINEADO; // hueco antes de la fecha
    page.drawText(fechaLinea, { x, y, size: CUERPO, font: fuentes.normal, color: negro });
    return y;
  };

  const yEu = dibujarColumna(xEu, cuerpoEu, `Berrizen, ${fecha} (e)an`);
  const yEs = dibujarColumna(xEs, cuerpoEs, `En Berriz, a ${fecha}`);

  // Bloques de firma alineados: hueco para firmar + línea + etiqueta.
  const yFirmaLinea = Math.min(yEu, yEs) - 58;
  const anchoLinea = anchoCol * 0.8;

  for (const [x, etiquetas] of [
    [xEu, ["C.D. Berriz ordezkatzen", "En representación de C.D. Berriz"]],
    [xEs, [datos.nombre]],
  ] as const) {
    page.drawLine({
      start: { x, y: yFirmaLinea },
      end: { x: x + anchoLinea, y: yFirmaLinea },
      thickness: 0.7,
      color: negro,
    });
    let y = yFirmaLinea - 12;
    for (const etiqueta of etiquetas) {
      page.drawText(etiqueta, { x, y, size: 8.5, font: fuentes.negrita, color: negro });
      y -= 11;
    }
  }

  return yFirmaLinea - 12 - 11 * 2;
}

/** Genera el PDF (una página, dos copias) de un resguardo. */
export async function generarResguardoPDF(
  datos: DatosResguardo,
  escudoPng: Uint8Array,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const escudo = await doc.embedPng(escudoPng);

  const page = doc.addPage([A4.ancho, A4.alto]);

  // Escudo en cabecera (~2,3 cm como en la plantilla original).
  const escudoAncho = 64;
  const escudoAlto = (escudo.height / escudo.width) * escudoAncho;
  page.drawImage(escudo, {
    x: MARGEN,
    y: A4.alto - MARGEN - escudoAlto,
    width: escudoAncho,
    height: escudoAlto,
  });

  const fuentes = { normal, negrita };

  // Copia 1 (club).
  const finCopia1 = dibujarCopia(page, datos, fuentes, A4.alto - MARGEN - escudoAlto - 34);

  // Separador discontinuo, como en la plantilla.
  const ySep = finCopia1 - 30;
  page.drawLine({
    start: { x: MARGEN, y: ySep },
    end: { x: A4.ancho - MARGEN, y: ySep },
    thickness: 0.7,
    color: rgb(0.4, 0.4, 0.4),
    dashArray: [4, 3],
  });

  // Copia 2 (persona).
  dibujarCopia(page, datos, fuentes, ySep - 44);

  return doc.save();
}

/** Nombre de archivo seguro para el PDF de un resguardo. */
export function nombreArchivoResguardo(datos: DatosResguardo) {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const concepto = datos.tipo === "entrenador" ? datos.concepto : datos.fecha;
  return `resguardo-${slug(datos.nombre)}-${slug(concepto)}.pdf`;
}
