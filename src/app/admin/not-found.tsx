import { PaginaNoEncontrada } from "@/components/PaginaNoEncontrada";

// 404 dentro del panel: mismo diseño que el de la web, pero devolviendo al
// panel en vez de a la portada.
export default function NotFoundAdmin() {
  return (
    <PaginaNoEncontrada
      texto="Esta pantalla del panel no existe o ha cambiado de sitio."
      enlace={{ href: "/admin", label: "Volver al panel" }}
    />
  );
}
