import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CarnetSocio } from "@/components/CarnetSocio";
import { CuentaLogin } from "./CuentaLogin";
import { CuentaAcciones } from "./CuentaAcciones";

const ESTADO_LABEL: Record<string, { es: string; eu: string }> = {
  activo: { es: "Activo", eu: "Aktiboa" },
  pendiente: { es: "Pendiente", eu: "Zain" },
  moroso: { es: "Pago pendiente", eu: "Ordainketa zain" },
  baja: { es: "Baja", eu: "Baja" },
};

export default async function CuentaPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const titulo = eu ? "Nire kuota" : "Mi cuota";

  // Sin sesión → formulario de acceso por email.
  if (!user?.email) {
    return (
      <>
        <PageHeader title={titulo} />
        <div className="container max-w-2xl py-12 md:py-16">
          <CuentaLogin />
        </div>
      </>
    );
  }

  // Con sesión → buscar su ficha de socio por el email autenticado.
  const admin = createAdminClient();
  const { data: socio } = await admin
    .from("socios")
    .select(
      "nombre, apellidos, numero_socio, estado, carnet_token, foto_url, stripe_customer_id, tipos_abono(nombre)",
    )
    .ilike("email", user.email)
    .maybeSingle();

  const tipo = (socio as { tipos_abono?: { nombre: string } | null } | null)?.tipos_abono;

  return (
    <>
      <PageHeader title={titulo} />
      <div className="container max-w-2xl py-12 md:py-16">
        {socio ? (
          <div className="space-y-6">
            {/* Carné digital con QR */}
            <CarnetSocio
              socio={{
                nombre: socio.nombre,
                apellidos: socio.apellidos,
                numero_socio: socio.numero_socio,
                estado: socio.estado,
                carnet_token: socio.carnet_token,
                foto_url: socio.foto_url,
                cuota: tipo?.nombre ?? null,
              }}
              locale={locale}
            />

            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="text-sm text-neutral-500">{eu ? "Bazkidea" : "Socio/a"}</p>
              <p className="font-display text-xl font-bold text-azul-700">
                {socio.nombre} {socio.apellidos}
              </p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">{eu ? "Kuota" : "Cuota"}</dt>
                  <dd className="font-semibold">{tipo?.nombre ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{eu ? "Egoera" : "Estado"}</dt>
                  <dd className="font-semibold">
                    {ESTADO_LABEL[socio.estado]?.[eu ? "eu" : "es"] ?? socio.estado}
                  </dd>
                </div>
              </dl>
            </div>
            <CuentaAcciones tienePago={!!socio.stripe_customer_id} />
          </div>
        ) : (
          <div className="space-y-6">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
              {eu
                ? "Ez dugu kuota bat aurkitu email honekin. Jarri klubarekin harremanetan."
                : "No encontramos una cuota asociada a este email. Ponte en contacto con el club."}
            </p>
            <CuentaAcciones tienePago={false} />
          </div>
        )}
      </div>
    </>
  );
}
