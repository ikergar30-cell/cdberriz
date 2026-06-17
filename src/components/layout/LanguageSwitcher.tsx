"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter, routing } from "@/i18n/routing";

// Selector de idioma castellano / euskera. Mantiene la página actual al cambiar.
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function change(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="inline-flex items-center rounded-full border border-neutral-200 p-0.5 text-xs font-bold">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          aria-current={l === locale}
          className={`rounded-full px-2.5 py-1 uppercase transition ${
            l === locale
              ? "bg-azul text-white"
              : "text-neutral-500 hover:text-azul"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
