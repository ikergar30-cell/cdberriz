import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function temporadaActual(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// Página de verificación del carné (control de acceso). Solo empleados del club.
export default async function VerificarPage({
  params: { token },
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Debe ser un empleado del club (no un socio logueado).
  let esEmpleado = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    esEmpleado = !!perfil;
  }

  if (!esEmpleado) {
    return (
      <Marco>
        <p className="text-lg font-semibold text-neutral-800">Acceso solo para el club</p>
        <p className="mt-2 text-neutral-600">Inicia sesión como empleado para verificar carnés.</p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block rounded-full bg-azul px-6 py-3 text-sm font-semibold text-white"
        >
          Iniciar sesión
        </Link>
      </Marco>
    );
  }

  // Buscar el socio por el token del carné (con service_role).
  const admin = createAdminClient();
  const { data: socio } = await admin
    .from("socios")
    .select("nombre, apellidos, numero_socio, estado, foto_url, tipos_abono(nombre)")
    .eq("carnet_token", token)
    .maybeSingle();

  if (!socio) {
    return (
      <Marco>
        <Estado ok={false} grande="✗" titulo="Carné no válido" />
        <p className="mt-2 text-neutral-600">Este código no corresponde a ningún socio.</p>
      </Marco>
    );
  }

  const tipo = (socio as unknown as { tipos_abono?: { nombre: string } | null }).tipos_abono;
  const valido = socio.estado === "activo";

  return (
    <Marco>
      <Estado
        ok={valido}
        grande={valido ? "✓" : "✗"}
        titulo={valido ? "ACCESO VÁLIDO" : "NO VÁLIDO"}
      />
      <div className="mt-6 flex items-center gap-4">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          {socio.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={socio.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-neutral-300">
              👤
            </div>
          )}
        </div>
        <div className="text-left">
          <p className="font-display text-xl font-bold text-azul-700">
            {socio.nombre} {socio.apellidos}
          </p>
          <p className="text-sm text-neutral-500">Socio nº {socio.numero_socio}</p>
          <p className="text-sm text-neutral-700">{tipo?.nombre ?? "—"}</p>
          <p className="text-xs text-neutral-500">Temporada {temporadaActual()}</p>
        </div>
      </div>
      {!valido && (
        <p className="mt-4 rounded-lg bg-rojo-50 p-3 text-sm font-semibold text-rojo">
          Estado: {socio.estado}. No tiene la cuota en vigor.
        </p>
      )}
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        {children}
      </div>
    </main>
  );
}

function Estado({ ok, grande, titulo }: { ok: boolean; grande: string; titulo: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white ${
          ok ? "bg-green-500" : "bg-rojo"
        }`}
      >
        {grande}
      </div>
      <p className={`mt-3 font-display text-2xl font-extrabold ${ok ? "text-green-600" : "text-rojo"}`}>
        {titulo}
      </p>
    </div>
  );
}
