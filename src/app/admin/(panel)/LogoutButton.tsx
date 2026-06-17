"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function salir() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-rojo"
    >
      Cerrar sesión
    </button>
  );
}
