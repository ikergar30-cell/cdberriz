import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="container flex min-h-[55vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-rojo">404</p>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="max-w-md text-neutral-600">{t("text")}</p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-azul px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700"
      >
        {t("volver")}
      </Link>
    </div>
  );
}
