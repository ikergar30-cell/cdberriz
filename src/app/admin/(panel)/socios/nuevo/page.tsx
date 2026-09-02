import { createClient } from "@/lib/supabase/server";
import type { TipoAbono } from "@/lib/supabase/types";
import { SocioForm } from "../SocioForm";
import { crearSocio } from "../actions";
import { CabeceraPagina, CuerpoPagina } from "../../ui";

export default async function NuevoSocioPage() {
  const supabase = createClient();
  const [{ data: tipos }, { data: sociosParaTitular }] = await Promise.all([
    supabase.from("tipos_abono").select("*").eq("activo", true).order("orden"),
    supabase.from("socios").select("id, nombre, apellidos, numero_socio").order("numero_socio"),
  ]);

  return (
    <>
      <CabeceraPagina titulo="Nuevo socio" volver={{ href: "/admin/socios", label: "Volver a socios" }} />
      <CuerpoPagina>
      <SocioForm
        tipos={(tipos as TipoAbono[]) ?? []}
        accion={crearSocio}
        sociosParaTitular={sociosParaTitular ?? []}
      />
      </CuerpoPagina>
    </>
  );
}
