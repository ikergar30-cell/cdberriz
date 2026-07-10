// Datos centralizados del club.
export const club = {
  nombre: "C.D. Berriz",
  fundacion: 1973,
  // Estadio
  estadio: "Berrizburu",
  medidas: "100 × 63 m",
  // Terreno de juego (bilingüe)
  terreno: { es: "Hierba artificial", eu: "Belar artifiziala" },
  inauguracion: "31/8/1974",
  direccion: "Learreta-Markina Kalea 28, 48240 Berriz (Bizkaia)",
  telefono: "692 076 167",
  // Email público del club (el formulario de contacto va aparte, a coordinación)
  email: "infocdberriz@gmail.com",
  // Remitente de TODOS los emails automáticos de la web (contacto, aviso de
  // carné, etc.). Requiere que el dominio cdberriz.com esté verificado en
  // Resend. Se puede sobreescribir con la variable de entorno CONTACT_FROM.
  remitente: "C.D. Berriz <no-responder@cdberriz.com>",
  // Tienda oficial (Fútbol Emotion) — se abre en pestaña nueva
  tiendaUrl:
    "https://www.futbolemotion.com/es/categoria/colectivos/equipaciones-cd-berriz",
  redes: {
    facebook: "https://www.facebook.com/cdberriz/",
    instagram: "https://www.instagram.com/cdberriz/",
    twitter: "https://x.com/cdberriz",
    // TODO: confirmar (deducidas del handle @cdberriz; linktr.ee bloquea el acceso automático)
    tiktok: "https://www.tiktok.com/@cdberriz",
    youtube: "https://www.youtube.com/@cdberriz",
  },
};
