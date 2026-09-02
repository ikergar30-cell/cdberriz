import { PaginaNoEncontrada } from "@/components/PaginaNoEncontrada";

export default function NotFoundIntranet() {
  return (
    <PaginaNoEncontrada
      texto="Esta página de la intranet no existe o ha cambiado de sitio."
      enlace={{ href: "/intranet", label: "Volver a la intranet" }}
    />
  );
}
