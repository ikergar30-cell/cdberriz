import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JugadorForm } from "../JugadorForm";
import { crearJugador } from "../actions";

export default async function NuevoJugadorPage() {
  const supabase = createClient();
  const { data: socios } = await supabase
    .from("socios")
    .select("id, nombre, apellidos, numero_socio")
    .order("numero_socio");

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/familias" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        ← Volver a familias
      </Link>
      <h1 className="mb-6 mt-2 font-display text-2xl font-extrabold uppercase text-neutral-900">
        Nuevo/a jugador/a
      </h1>
      <JugadorForm socios={socios ?? []} accion={crearJugador} />
    </div>
  );
}
