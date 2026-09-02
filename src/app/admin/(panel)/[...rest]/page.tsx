import { notFound } from "next/navigation";

// Igual que en la web pública, pero dentro del panel: una URL inexistente
// de /admin muestra el 404 con la barra lateral (src/app/admin/not-found.tsx).
export default function CualquierOtraRutaDelPanel() {
  notFound();
}
