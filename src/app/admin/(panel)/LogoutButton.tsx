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

  // "oscuro" es para la sidebar roja de la intranet; "claro" para fondos blancos.
  const estilo =
    variante === "oscuro"
      ? "text-rojo-100 hover:bg-white/10 hover:text-white"
      : "text-neutral-600 hover:bg-neutral-100 hover:text-rojo";

  return (
    <button
      onClick={salir}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${estilo}`}
    >
      Cerrar sesión
    </button>
  );
}
