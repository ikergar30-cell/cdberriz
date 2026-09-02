"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ variante = "claro" }: { variante?: "claro" | "oscuro" }) {
  const router = useRouter();

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  // "oscuro" es para la sidebar azul de la intranet; "claro" para fondos blancos.
  const estilo =
    variante === "oscuro"
      ? "text-white/55 hover:bg-white/10 hover:text-white"
      : "text-neutral-500 hover:bg-neutral-100 hover:text-rojo";

  return (
    <button
      onClick={salir}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${estilo}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px] shrink-0"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </svg>
      Cerrar sesión
    </button>
  );
}
