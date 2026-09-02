import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Socio, TipoAbono } from "@/lib/supabase/types";
import { SocioForm } from "../../SocioForm";
import { actualizarSocio, eliminarSocio } from "../../actions";
import { BotonEliminar } from "../BotonEliminar";
import { CabeceraPagina, CuerpoPagina } from "../../../ui";

export default async function EditarSocioPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: socio }, { data: tipos }, { data: sociosParaTitular }] = await Promise.all([
    supabase.from("socios").select("*").eq("id", id).single(),
    supabase.from("tipos_abono").select("*").eq("activo", true).order("orden"),
    supabase.from("socios").select("id, nombre, apellidos, numero_socio").order("numero_socio"),
  ]);

  if (!socio) notFound();

  const s = socio as Socio;
  const actualizar = actualizarSocio.bind(null, id);
  const eliminar = eliminarSocio.bind(null, id);

  return (
    <>
      <CabeceraPagina
        titulo={`Editar · Socio nº ${s.numero_socio}`}
        volver={{ href: `/admin/socios/${id}`, label: "Volver a la ficha" }}
      >
        <BotonEliminar accion={eliminar} />
      </CabeceraPagina>
      <CuerpoPagina>

      <SocioForm
        socio={s}
        tipos={(tipos as TipoAbono[]) ?? []}
        accion={actualizar}
        cancelarHref={`/admin/socios/${id}`}
        sociosParaTitular={sociosParaTitular ?? []}
      />
      </CuerpoPagina>
    </>
  );
}
