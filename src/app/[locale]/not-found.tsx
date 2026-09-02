import { useTranslations } from "next-intl";
import { PaginaNoEncontrada } from "@/components/PaginaNoEncontrada";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <PaginaNoEncontrada
      titulo={t("title")}
      texto={t("text")}
      enlace={{ href: "/", label: t("volver") }}
    />
  );
}
