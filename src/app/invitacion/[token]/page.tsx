import Image from "next/image";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Página pública (sin login) que abre el invitado en su móvil para
// enseñarla en la entrada del campo. El QR apunta a /verificar/<token>, la
// misma página de estado que usan los carnés de socio.
export default async function InvitacionPage({
  params: { token },
}: {
  params: { token: string };
}) {
  const admin = createAdminClient();
  const { data: invitado } = await admin
    .from("invitados")
    .select("id, nombre, motivo, expira_en, revocado_en, usos_maximos, token")
    .eq("token", token)
    .maybeSingle();

  if (!invitado) {
    return (
      <Marco>
        <p className="text-lg font-semibold text-neutral-800">Invitación no válida</p>
        <p className="mt-2 text-neutral-600">Este enlace no corresponde a ninguna invitación.</p>
      </Marco>
    );
  }

  const { count: usados } = await admin
    .from("entradas_invitado")
    .select("id", { count: "exact", head: true })
    .eq("invitado_id", invitado.id);

  const caducado = new Date(invitado.expira_en) < new Date();
  const agotado = (usados ?? 0) >= invitado.usos_maximos;
  const vigente = !invitado.revocado_en && !caducado && !agotado;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const qrSvg = await QRCode.toString(`${site}/verificar/${invitado.token}`, {
    type: "svg",
    margin: 0,
    color: { dark: "#00528F", light: "#ffffff" },
  });

  return (
    <Marco>
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
        <div className="flex items-center gap-3 bg-azul-900 px-6 py-4 text-white">
          <Image src="/escudo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          <div>
            <p className="font-display text-sm font-extrabold uppercase leading-none">C.D. Berriz</p>
            <p className="text-xs text-azul-100">Invitación temporal</p>
          </div>
        </div>

        <div className="p-6">
          <p className="font-display text-xl font-bold text-azul-700">{invitado.nombre}</p>
          {invitado.motivo && <p className="mt-1 text-sm text-neutral-600">{invitado.motivo}</p>}
          <span
            className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
              vigente ? "bg-green-100 text-green-700" : "bg-rojo-50 text-rojo"
            }`}
          >
            {invitado.revocado_en
              ? "Invitación anulada"
              : caducado
                ? "Caducada"
                : agotado
                  ? "Ya se ha usado"
                  : "Válida"}
          </span>
          <p className="mt-3 text-xs text-neutral-500">
            Válida hasta {formatearFecha(invitado.expira_en)}
          </p>
        </div>

        {vigente && (
          <div className="flex flex-col items-center border-t border-neutral-200 px-6 py-5">
            <div className="h-48 w-48" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="mt-3 text-center text-xs text-neutral-500">
              Muestra este código en la entrada
            </p>
          </div>
        )}
      </div>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">{children}</div>
    </main>
  );
}
