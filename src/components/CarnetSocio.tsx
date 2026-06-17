import QRCode from "qrcode";
import Image from "next/image";

// Temporada del club ("2026-2027") según la fecha.
function temporadaActual(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

type Datos = {
  nombre: string;
  apellidos: string;
  numero_socio: number;
  estado: string;
  carnet_token: string | null;
  foto_url: string | null;
  cuota?: string | null;
};

// Carnet de socio digital con QR. El QR apunta a la página de verificación
// (solo el club, logueado, puede ver el resultado del escaneo).
export async function CarnetSocio({
  socio,
  locale,
}: {
  socio: Datos;
  locale: string;
}) {
  const eu = locale === "eu";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const qrSvg = socio.carnet_token
    ? await QRCode.toString(`${site}/verificar/${socio.carnet_token}`, {
        type: "svg",
        margin: 0,
        color: { dark: "#00528F", light: "#ffffff" },
      })
    : null;

  const activo = socio.estado === "activo";

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
      {/* Cabecera con escudo */}
      <div className="flex items-center gap-3 bg-azul-900 px-6 py-4 text-white">
        <Image src="/escudo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
        <div>
          <p className="font-display text-sm font-extrabold uppercase leading-none">C.D. Berriz</p>
          <p className="text-xs text-azul-100">{eu ? "Bazkide-txartela" : "Carné de socio/a"}</p>
        </div>
      </div>

      <div className="flex gap-4 p-6">
        {/* Foto (si la hay) */}
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          {socio.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={socio.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-300">
              👤
            </div>
          )}
        </div>

        {/* Datos */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold text-azul-700">
            {socio.nombre} {socio.apellidos}
          </p>
          <p className="text-xs text-neutral-500">
            {eu ? "Bazkide zk." : "Socio nº"} {socio.numero_socio}
          </p>
          {socio.cuota && (
            <p className="mt-1 text-sm text-neutral-700">{socio.cuota}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            {eu ? "Denboraldia" : "Temporada"} {temporadaActual()}
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
              activo ? "bg-green-100 text-green-700" : "bg-rojo-50 text-rojo"
            }`}
          >
            {activo ? (eu ? "Indarrean" : "En vigor") : (eu ? "Ez aktiboa" : "No activo")}
          </span>
        </div>
      </div>

      {/* QR */}
      {qrSvg && (
        <div className="flex flex-col items-center border-t border-neutral-200 px-6 py-5">
          <div className="h-40 w-40" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <p className="mt-3 text-center text-xs text-neutral-500">
            {eu
              ? "Erakutsi kode hau sarreran"
              : "Muestra este código en la entrada"}
          </p>
        </div>
      )}
    </div>
  );
}
