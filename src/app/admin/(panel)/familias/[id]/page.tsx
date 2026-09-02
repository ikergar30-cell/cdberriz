import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Jugador } from "@/lib/supabase/types";
import { JugadorForm, type SocioParaVincular } from "../JugadorForm";
import { actualizarJugador } from "../actions";
import { BotonEliminarJugador } from "../BotonEliminarJugador";
import { CabeceraPagina, CuerpoPagina } from "../../ui";

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
    <>
      <CabeceraPagina
        titulo={`Editar · ${jugador.nombre} ${jugador.apellidos ?? ""}`}
        volver={{ href: "/admin/familias", label: "Volver a familias" }}
      >
        <BotonEliminarJugador id={id} nombre={`${jugador.nombre} ${jugador.apellidos ?? ""}`} />
      </CabeceraPagina>
      <CuerpoPagina>
      <JugadorForm
        jugador={jugador as unknown as Jugador & { madre: SocioParaVincular | null; padre: SocioParaVincular | null }}
        socios={socios ?? []}
        accion={actualizar}
      />
      </CuerpoPagina>
    </>
  );
}
