import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

// Genera el PDF del carné físico de socio para enviar a imprenta. Cada socio
// ocupa una página con el tamaño estándar de tarjeta CR80 (85,6 × 54 mm, el
// mismo que una tarjeta bancaria). Incluye, como mínimo: QR de verificación,
// nombre y apellidos, y número de socio.
//
// IMPORTANTE: el QR es EXACTAMENTE el mismo que el del carné digital — apunta
// a /verificar/<carnet_token>, el identificador único del socio. Así el mismo
// código sirve en pantalla y en tarjeta, y darse de baja invalida ambos.

export type SocioCarnet = {
  nombre: string;
  apellidos: string;
  numero_socio: number;
  carnet_token: string;
};

// Tarjeta CR80 en puntos PDF (1 mm = 2,834645 pt).
const MM = 2.834645;
const CARD_W = 85.6 * MM; // 242,6 pt
const CARD_H = 54 * MM; //   153,1 pt

const AZUL_900 = rgb(0.039, 0.184, 0.302);
const AZUL_700 = rgb(0.004, 0.271, 0.467);
const AZUL_QR = rgb(0, 0.322, 0.561);
const ROJO = rgb(0.886, 0.063, 0.102);
const GRIS = rgb(0.45, 0.45, 0.45);

function temporadaActual(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export async function generarCarnetsPDF(
  socios: SocioCarnet[],
  escudoPng: Uint8Array,
  siteUrl: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const escudo = await doc.embedPng(escudoPng);
  const temporada = temporadaActual();

  for (const socio of socios) {
    const page = doc.addPage([CARD_W, CARD_H]);

    // Fondo blanco.
    page.drawRectangle({ x: 0, y: 0, width: CARD_W, height: CARD_H, color: rgb(1, 1, 1) });

    // Cabecera azul con escudo (extiende hasta el borde para tolerar el corte).
    const headerH = 13 * MM;
    page.drawRectangle({ x: 0, y: CARD_H - headerH, width: CARD_W, height: headerH, color: AZUL_900 });
    // Filete rojo bajo la cabecera (identidad del club).
    page.drawRectangle({ x: 0, y: CARD_H - headerH - 1.4, width: CARD_W, height: 1.4, color: ROJO });

    const escudoH = 9 * MM;
    const escudoW = (escudo.width / escudo.height) * escudoH;
    const escudoX = 5 * MM;
    page.drawImage(escudo, {
      x: escudoX,
      y: CARD_H - headerH + (headerH - escudoH) / 2,
      width: escudoW,
      height: escudoH,
    });

    const textoCabX = escudoX + escudoW + 3 * MM;
    page.drawText("C.D. BERRIZ", {
      x: textoCabX,
      y: CARD_H - headerH / 2 + 1,
      size: 11,
      font: negrita,
      color: rgb(1, 1, 1),
    });
    page.drawText("Carné de socio/a", {
      x: textoCabX,
      y: CARD_H - headerH / 2 - 8,
      size: 7,
      font: normal,
      color: rgb(0.81, 0.89, 0.96),
    });

    // QR (mismo destino que el digital). Alta resolución para impresión.
    const qrPng = await QRCode.toBuffer(`${siteUrl}/verificar/${socio.carnet_token}`, {
      type: "png",
      margin: 0,
      width: 600,
      color: { dark: "#00528F", light: "#ffffff" },
    });
    const qr = await doc.embedPng(qrPng);
    const qrSize = 26 * MM;
    const qrX = CARD_W - 5 * MM - qrSize;
    const qrY = 5 * MM;
    page.drawImage(qr, { x: qrX, y: qrY, width: qrSize, height: qrSize });

    // Datos del socio (columna izquierda).
    const datosX = 5 * MM;
    const anchoTexto = qrX - datosX - 2 * MM;

    // Nombre: se reduce el cuerpo si no cabe en el ancho disponible.
    let sizeNombre = 13;
    const nombre = socio.nombre;
    while (sizeNombre > 8 && negrita.widthOfTextAtSize(nombre, sizeNombre) > anchoTexto) {
      sizeNombre -= 0.5;
    }
    let y = CARD_H - headerH - 8 * MM;
    page.drawText(nombre, { x: datosX, y, size: sizeNombre, font: negrita, color: AZUL_700 });

    // Apellidos: parte en dos líneas si hace falta.
    let sizeApe = 11;
    const apellidos = socio.apellidos;
    while (sizeApe > 8 && negrita.widthOfTextAtSize(apellidos, sizeApe) > anchoTexto) {
      sizeApe -= 0.5;
    }
    y -= 5 * MM;
    if (negrita.widthOfTextAtSize(apellidos, sizeApe) <= anchoTexto) {
      page.drawText(apellidos, { x: datosX, y, size: sizeApe, font: negrita, color: AZUL_700 });
    } else {
      // Parte por la mitad de palabras.
      const palabras = apellidos.split(" ");
      const mitad = Math.ceil(palabras.length / 2);
      page.drawText(palabras.slice(0, mitad).join(" "), { x: datosX, y, size: sizeApe, font: negrita, color: AZUL_700 });
      y -= 4 * MM;
      page.drawText(palabras.slice(mitad).join(" "), { x: datosX, y, size: sizeApe, font: negrita, color: AZUL_700 });
    }

    y -= 6 * MM;
    page.drawText(`Socio nº ${socio.numero_socio}`, { x: datosX, y, size: 9, font: normal, color: GRIS });
    y -= 4.2 * MM;
    page.drawText(`Temporada ${temporada}`, { x: datosX, y, size: 8, font: normal, color: GRIS });

    // Etiqueta bajo el QR.
    const etiqueta = "Escanear en la entrada";
    const wEt = normal.widthOfTextAtSize(etiqueta, 5.5);
    page.drawText(etiqueta, {
      x: qrX + (qrSize - wEt) / 2,
      y: qrY - 3 * MM,
      size: 5.5,
      font: normal,
      color: AZUL_QR,
    });
  }

  return doc.save();
}

/** Nombre de archivo seguro para el PDF de un carné. */
export function nombreArchivoCarnet(socio: SocioCarnet) {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `carne-${socio.numero_socio}-${slug(socio.nombre + "-" + socio.apellidos)}.pdf`;
}
