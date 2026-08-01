import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TipoAbono } from "@/lib/supabase/types";
import { SocioForm } from "../SocioForm";
import { crearSocio } from "../actions";

export default async function NuevoSocioPage() {
  const supabase = createClient();
  const [{ data: tipos }, { data: sociosParaTitular }] = await Promise.all([
    supabase.from("tipos_abono").select("*").eq("activo", true).order("orden"),
    supabase.from("socios").select("id, nombre, apellidos, numero_socio").order("numero_socio"),
  ]);

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/socios" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        ← Volver a socios
      </Link>
      <h1 className="mb-6 mt-2 font-display text-2xl font-extrabold uppercase text-neutral-900">
        Nuevo socio
      </h1>
      <SocioForm
        tipos={(tipos as TipoAbono[]) ?? []}
        accion={crearSocio}
        sociosParaTitular={sociosParaTitular ?? []}
      />
    </div>
  );
}
