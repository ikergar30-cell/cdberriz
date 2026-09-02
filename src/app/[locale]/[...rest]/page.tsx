import { notFound } from "next/navigation";

// Cualquier URL de la web pública que no exista cae aquí y dispara el 404
// del club (src/app/[locale]/not-found.tsx). Sin esta ruta comodín, Next
// mostraría su 404 en blanco por defecto: el not-found de un segmento solo
// se activa cuando alguien llama a notFound(), no ante una URL suelta.
export default function CualquierOtraRuta() {
  notFound();
}
