import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { CopiarEnlace } from "../CopiarEnlace";
import { BotonRevocar } from "../BotonRevocar";
import { CabeceraPagina, CuerpoPagina } from "../../ui";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InvitadoDetallePage({ params: { id } }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: invitado } = await supabase
    .from("invitados")
    .select("id, nombre, motivo, token, expira_en, usos_maximos, revocado_en")
    .eq("id", id)
    .maybeSingle();

  if (!invitado) notFound();

  const { count: usados } = await supabase
    .from("entradas_invitado")
    .select("id", { count: "exact", head: true })
    .eq("invitado_id", id);

  const caducado = new Date(invitado.expira_en) < new Date();
  const agotado = (usados ?? 0) >= invitado.usos_maximos;
  const vigente = !invitado.revocado_en && !caducado && !agotado;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${siteUrl}/invitacion/${invitado.token}`;
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 0, color: { dark: "#00528F", light: "#ffffff" } });

  return (
    <>
      <CabeceraPagina
        titulo="Invitación temporal"
        volver={{ href: "/admin/invitados", label: "Volver a invitados" }}
      />
      <CuerpoPagina>
      <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-neutral-900">{invitado.nombre}</h1>
            {invitado.motivo && <p className="text-sm text-neutral-500">{invitado.motivo}</p>}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              vigente ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {invitado.revocado_en ? "Revocada" : caducado ? "Caducada" : agotado ? "Agotada" : "Vigente"}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-neutral-400">Caduca</dt>
            <dd className="text-neutral-800">{formatearFecha(invitado.expira_en)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-neutral-400">Usos</dt>
            <dd className="text-neutral-800">
              {usados ?? 0}/{invitado.usos_maximos}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="mb-1.5 text-xs font-semibold uppercase text-neutral-400">Enlace para el invitado</p>
          <CopiarEnlace url={url} />
        </div>

        {vigente && (
          <div className="mt-5 flex flex-col items-center border-t border-neutral-200 pt-5">
            <div className="h-40 w-40" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="mt-3 text-xs text-neutral-500">
              También puedes enseñar tú este QR en la entrada, en vez del enlace.
            </p>
          </div>
        )}

        {vigente && (
          <div className="mt-4 text-right">
            <BotonRevocar id={invitado.id} nombre={invitado.nombre} />
          </div>
        )}
      </div>
      </CuerpoPagina>
    </>
  );
}
