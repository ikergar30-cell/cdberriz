import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Socio, TipoAbono } from "@/lib/supabase/types";
import { SocioForm } from "../../SocioForm";
import { actualizarSocio, eliminarSocio } from "../../actions";
import { BotonEliminar } from "../BotonEliminar";

export default async function EditarSocioPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: socio }, { data: tipos }] = await Promise.all([
    supabase.from("socios").select("*").eq("id", id).single(),
    supabase.from("tipos_abono").select("*").eq("activo", true).order("orden"),
  ]);

  if (!socio) notFound();

  const s = socio as Socio;
  const actualizar = actualizarSocio.bind(null, id);
  const eliminar = eliminarSocio.bind(null, id);

  return (
    <div className="p-6 md:p-8">
      <Link
        href={`/admin/socios/${id}`}
        className="text-sm font-semibold text-neutral-500 hover:text-neutral-800"
      >
        ← Volver a la ficha
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
          Editar · Socio nº {s.numero_socio}
        </h1>
        <BotonEliminar accion={eliminar} />
      </div>

      <SocioForm
        socio={s}
        tipos={(tipos as TipoAbono[]) ?? []}
        accion={actualizar}
        cancelarHref={`/admin/socios/${id}`}
      />
    </div>
  );
}
