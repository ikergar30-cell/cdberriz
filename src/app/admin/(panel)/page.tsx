import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio } from "@/lib/supabase/types";

// Cuenta socios por estado. RLS garantiza que solo un empleado ve estos datos.
async function contarPorEstado(estado: EstadoSocio) {
  const supabase = createClient();
  const { count } = await supabase
    .from("socios")
    .select("*", { count: "exact", head: true })
    .eq("estado", estado);
  return count ?? 0;
}

// Socios dados de alta en el mes actual.
async function contarAltasMes() {
  const supabase = createClient();
  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  const { count } = await supabase
    .from("socios")
    .select("*", { count: "exact", head: true })
    .gte("created_at", primerDiaMes);
  return count ?? 0;
}

// Solicitudes de carné físico todavía sin marcar como listas para recoger.
async function contarCarnetsPendientes() {
  const supabase = createClient();
  const { count } = await supabase
    .from("socios")
    .select("*", { count: "exact", head: true })
    .not("carnet_fisico_pedido_en", "is", null)
    .is("carnet_fisico_entregado_en", null);
  return count ?? 0;
}

// Contactos suscritos al newsletter via Resend.
async function contarSuscriptores(): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return "—";
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return "—";
    const json = await res.json();
    // La API devuelve { data: [...] }
    const lista = json?.data ?? [];
    return String(lista.length);
  } catch {
    return "—";
  }
}

export default async function ResumenPage() {
  const [activos, pendientes, morosos, bajas, altasMes, suscriptores, carnetsPendientes] = await Promise.all([
    contarPorEstado("activo"),
    contarPorEstado("pendiente"),
    contarPorEstado("moroso"),
    contarPorEstado("baja"),
    contarAltasMes(),
    contarSuscriptores(),
    contarCarnetsPendientes(),
  ]);

  const tarjetas = [
    { label: "Socios activos", valor: activos, color: "text-green-600" },
    { label: "Pendientes", valor: pendientes, color: "text-amber-600" },
    { label: "Morosos", valor: morosos, color: "text-rojo" },
    { label: "Bajas", valor: bajas, color: "text-neutral-400" },
    { label: "Altas este mes", valor: altasMes, color: "text-azul" },
    { label: "Suscriptores newsletter", valor: suscriptores, color: "text-purple-600" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
          Resumen
        </h1>
        <Link
          href="/admin/socios"
          className="rounded-full bg-rojo px-4 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600"
        >
          Gestionar socios
        </Link>
      </div>

      {carnetsPendientes > 0 && (
        <Link
          href="/admin/socios/carnets"
          className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 transition hover:bg-amber-100"
        >
          <span>
            ⚠ <strong>{carnetsPendientes}</strong> carné{carnetsPendientes === 1 ? "" : "s"} físico
            {carnetsPendientes === 1 ? "" : "s"} pendiente{carnetsPendientes === 1 ? "" : "s"} de
            preparar y marcar como listo para recoger.
          </span>
          <span className="font-semibold underline">Ver →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((t) => (
          <div key={t.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-medium text-neutral-500">{t.label}</p>
            <p className={`mt-2 font-display text-4xl font-extrabold ${t.color}`}>
              {t.valor}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-neutral-500">
        Total de socios: <strong>{activos + pendientes + morosos + bajas}</strong>
      </p>

      {/* Acceso rápido a Sanity Studio */}
      <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
          Publicar contenido
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Añade noticias y eventos en el gestor de contenidos. No necesitas saber programar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/studio/intent/create/type=noticia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-azul px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700"
          >
            📰 Publicar noticia →
          </a>
          <a
            href="/studio/intent/create/type=evento"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-rojo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600"
          >
            📅 Publicar evento →
          </a>
          <a
            href="/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:border-azul hover:text-azul"
          >
            Ver todo el contenido →
          </a>
        </div>
      </div>
    </div>
  );
}
