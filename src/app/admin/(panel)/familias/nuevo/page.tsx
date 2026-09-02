import { createClient } from "@/lib/supabase/server";
import { JugadorForm } from "../JugadorForm";
import { crearJugador } from "../actions";
import { CabeceraPagina, CuerpoPagina } from "../../ui";

export default async function NuevoJugadorPage() {
  const supabase = createClient();
  const { data: socios } = await supabase
    .from("socios")
    .select("id, nombre, apellidos, numero_socio")
    .order("numero_socio");

  return (
    <>
      <CabeceraPagina
        titulo="Nuevo/a jugador/a"
        volver={{ href: "/admin/familias", label: "Volver a familias" }}
      />
      <CuerpoPagina>
      <JugadorForm socios={socios ?? []} accion={crearJugador} />
      </CuerpoPagina>
    </>
  );
}
