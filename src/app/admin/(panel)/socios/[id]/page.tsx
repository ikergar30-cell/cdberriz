import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Pago, Socio, TipoAbono } from "@/lib/supabase/types";
import { CarnetSocio } from "@/components/CarnetSocio";
import { SocioForm } from "../SocioForm";
import { actualizarSocio, eliminarSocio } from "../actions";
import { BotonEliminar } from "./BotonEliminar";
import { HistorialPagos } from "./HistorialPagos";

export default async function EditarSocioPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: socio }, { data: tipos }, { data: pagos }] = await Promise.all([
    supabase.from("socios").select("*").eq("id", id).single(),
    supabase.from("tipos_abono").select("*").eq("activo", true).order("orden"),
    supabase.from("pagos").select("*").eq("socio_id", id).order("fecha", { ascending: false }),
  ]);

  if (!socio) notFound();

  const s = socio as Socio;
  const cuotaNombre =
    (tipos as TipoAbono[] | null)?.find((t) => t.id === s.tipo_abono_id)?.nombre ?? null;

  // Ligamos el id a las server actions.
  const actualizar = actualizarSocio.bind(null, id);
  const eliminar = eliminarSocio.bind(null, id);

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/socios" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        ← Volver a socios
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
            Socio nº {(socio as Socio).numero_socio}
          </h1>
          {s.carnet_fisico_pedido_en && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Carné físico solicitado
            </span>
          )}
        </div>
        <BotonEliminar accion={eliminar} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
        <SocioForm socio={s} tipos={(tipos as TipoAbono[]) ?? []} accion={actualizar} />
        {/* Carné digital del socio (para ver/imprimir) */}
        <div className="lg:w-80">
          <CarnetSocio
            socio={{
              nombre: s.nombre,
              apellidos: s.apellidos,
              numero_socio: s.numero_socio,
              estado: s.estado,
              carnet_token: s.carnet_token,
              foto_url: s.foto_url,
              cuota: cuotaNombre,
            }}
            locale="es"
          />
        </div>
      </div>

      <HistorialPagos pagos={(pagos as Pago[]) ?? []} />
    </div>
  );
}
