import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Jugador } from "@/lib/supabase/types";
import { JugadorForm, type SocioParaVincular } from "../JugadorForm";
import { actualizarJugador } from "../actions";
import { BotonEliminarJugador } from "../BotonEliminarJugador";

export default async function EditarJugadorPage({ params: { id } }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: jugador }, { data: socios }] = await Promise.all([
    supabase
      .from("jugadores")
      .select(
        "*, madre:madre_socio_id(id, nombre, apellidos, numero_socio), padre:padre_socio_id(id, nombre, apellidos, numero_socio)",
      )
      .eq("id", id)
      .single(),
    supabase.from("socios").select("id, nombre, apellidos, numero_socio").order("numero_socio"),
  ]);

  if (!jugador) notFound();

  const actualizar = actualizarJugador.bind(null, id);

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/familias" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        ← Volver a familias
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
          Editar · {jugador.nombre} {jugador.apellidos}
        </h1>
        <BotonEliminarJugador id={id} nombre={`${jugador.nombre} ${jugador.apellidos ?? ""}`} />
      </div>
      <JugadorForm
        jugador={jugador as unknown as Jugador & { madre: SocioParaVincular | null; padre: SocioParaVincular | null }}
        socios={socios ?? []}
        accion={actualizar}
      />
    </div>
  );
}
