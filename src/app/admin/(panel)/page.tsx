import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EstadoSocio, OrigenSocio } from "@/lib/supabase/types";
import { etiquetaTipoSocio } from "@/config/origenSocio";
import { Aviso, BotonEnlace, CabeceraPagina, CuerpoPagina, TarjetaCifra } from "./ui";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

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

// Últimas altas: los socios más recientes por fecha de alta. Solo aparecen
// los que la tienen registrada (las altas online la guardan siempre); el
// padrón histórico importado no la trae, y tampoco tendría sentido colarlo
// aquí como si se acabara de apuntar.
async function ultimasAltas() {
  const supabase = createClient();
  const { data } = await supabase
    .from("socios")
    .select("id, numero_socio, nombre, apellidos, origen, estado, tipo_abono_id, fecha_alta, tipos_abono(nombre)")
    .not("fecha_alta", "is", null)
    .order("fecha_alta", { ascending: false })
    .limit(6);
  return (data as unknown as UltimaAlta[]) ?? [];
}

interface UltimaAlta {
  id: string;
  numero_socio: number;
  nombre: string;
  apellidos: string;
  origen: OrigenSocio;
  estado: EstadoSocio;
  tipo_abono_id: string | null;
  fecha_alta: string;
  tipos_abono: { nombre: string } | null;
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
  const [activos, pendientes, morosos, bajas, altasMes, suscriptores, carnetsPendientes, ticketsNuevos, sociosARevisar, altasRecientes] = await Promise.all([
    contarPorEstado("activo"),
    contarPorEstado("pendiente"),
    contarPorEstado("moroso"),
    contarPorEstado("baja"),
    contarAltasMes(),
    contarSuscriptores(),
    contarCarnetsPendientes(),
    contarTicketsNuevos(),
    contarSociosARevisar(),
    ultimasAltas(),
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

        {/* Últimas altas */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50/70 px-5 py-3.5">
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-azul-900">
              Últimas altas
            </h2>
            <Link href="/admin/socios" className="text-xs font-semibold text-azul hover:underline">
              Ver todos los socios →
            </Link>
          </div>
          {altasRecientes.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-400">
              Todavía no hay ninguna alta con fecha registrada.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {altasRecientes.map((s) => {
                const tipo = etiquetaTipoSocio(s.origen, Boolean(s.tipo_abono_id));
                return (
                  <li key={s.id}>
                    <Link
                      href={`/admin/socios/${s.id}`}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 transition hover:bg-neutral-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-800">
                          {s.nombre} {s.apellidos}
                          <span className="ml-2 font-normal text-neutral-400">nº{s.numero_socio}</span>
                        </p>
                        <p className="text-xs text-neutral-400">
                          {s.tipos_abono?.nombre ?? "Sin cuota asignada"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tipo.badge}`}>
                          {tipo.label}
                        </span>
                        <span className="whitespace-nowrap text-xs tabular-nums text-neutral-400">
                          {formatearFecha(s.fecha_alta)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
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
