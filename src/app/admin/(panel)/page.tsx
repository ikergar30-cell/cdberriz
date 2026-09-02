import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio } from "@/lib/supabase/types";
import { Aviso, BotonEnlace, CabeceraPagina, CuerpoPagina, TarjetaCifra } from "./ui";

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

// Socios importados del padrón histórico que necesitan una revisión manual
// (p. ej. nombre repetido en el carné antiguo, sin aclarar si eran 1 o 2 personas).
async function contarSociosARevisar() {
  const supabase = createClient();
  const { count } = await supabase
    .from("socios")
    .select("*", { count: "exact", head: true })
    .ilike("notas", "%⚠ IMPORTACIÓN%");
  return count ?? 0;
}

// Tickets del buzón de contacto sin atender (estado "nuevo", no archivados).
async function contarTicketsNuevos() {
  const supabase = createClient();
  const { count } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("estado", "nuevo")
    .eq("archivado", false)
    .is("eliminado_en", null);
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
  const [activos, pendientes, morosos, bajas, altasMes, suscriptores, carnetsPendientes, ticketsNuevos, sociosARevisar] = await Promise.all([
    contarPorEstado("activo"),
    contarPorEstado("pendiente"),
    contarPorEstado("moroso"),
    contarPorEstado("baja"),
    contarAltasMes(),
    contarSuscriptores(),
    contarCarnetsPendientes(),
    contarTicketsNuevos(),
    contarSociosARevisar(),
  ]);

  const total = activos + pendientes + morosos + bajas;
  const tarjetas = [
    { label: "Socios activos", valor: activos, tono: "verde" as const, href: "/admin/socios?estado=activo" },
    { label: "Pendientes", valor: pendientes, tono: "ambar" as const, href: "/admin/socios?estado=pendiente" },
    { label: "Morosos", valor: morosos, tono: "rojo" as const, href: "/admin/socios?estado=moroso" },
    { label: "Bajas", valor: bajas, tono: "neutro" as const, href: "/admin/socios?estado=baja" },
    { label: "Altas este mes", valor: altasMes, tono: "azul" as const },
    { label: "Newsletter", valor: suscriptores, tono: "morado" as const, pie: "Suscriptores" },
  ];

  const hayAvisos = ticketsNuevos > 0 || sociosARevisar > 0 || carnetsPendientes > 0;

  return (
    <>
      <CabeceraPagina
        titulo="Resumen"
        descripcion={`El club tiene ${total} socios/as registrados en total.`}
      >
        <BotonEnlace href="/admin/verificar" tono="secundario">
          Verificar carné
        </BotonEnlace>
        <BotonEnlace href="/admin/socios" tono="primario">
          Gestionar socios
        </BotonEnlace>
      </CabeceraPagina>

      <CuerpoPagina>
        {hayAvisos && (
          <div className="mb-8 space-y-3">
            {ticketsNuevos > 0 && (
              <Aviso href="/admin/tickets" tono="rojo">
                Tienes <strong>{ticketsNuevos}</strong> mensaje{ticketsNuevos === 1 ? "" : "s"} sin
                atender en el buzón de contacto.
              </Aviso>
            )}
            {carnetsPendientes > 0 && (
              <Aviso href="/admin/socios/carnets">
                Hay <strong>{carnetsPendientes}</strong> carné{carnetsPendientes === 1 ? "" : "s"} físico
                {carnetsPendientes === 1 ? "" : "s"} pendiente{carnetsPendientes === 1 ? "" : "s"} de
                preparar y marcar como listo para recoger.
              </Aviso>
            )}
            {sociosARevisar > 0 && (
              <Aviso href="/admin/socios" accion="Ver socios">
                <strong>{sociosARevisar}</strong> socio{sociosARevisar === 1 ? "" : "s"} del padrón
                histórico necesita{sociosARevisar === 1 ? "" : "n"} revisión manual (nombre repetido en
                el carné antiguo). Mira su ficha, apartado &quot;Notas&quot;.
              </Aviso>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tarjetas.map((t) => (
            <TarjetaCifra key={t.label} {...t} />
          ))}
        </div>

        {/* Acceso rápido a Sanity Studio */}
        <div className="mt-8 rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-azul-50/60 to-white p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-azul-900">
            Publicar contenido
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Añade noticias y eventos a la web del club. No necesitas saber programar.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <BotonEnlace href="/studio/intent/create/type=noticia" tono="secundario" externo>
              Publicar noticia
            </BotonEnlace>
            <BotonEnlace href="/studio/intent/create/type=evento" tono="primario" externo>
              Publicar evento
            </BotonEnlace>
            <BotonEnlace href="/studio" externo>
              Ver todo el contenido
            </BotonEnlace>
          </div>
        </div>
      </CuerpoPagina>
    </>
  );
}
