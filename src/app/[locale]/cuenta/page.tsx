import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { sanityFetch } from "@/sanity/lib/sanityFetch";
import {
  eventosProximosQuery,
  noticiasRecientesQuery,
  documentosSociosQuery,
} from "@/sanity/lib/queries";
import type { Evento, Noticia, DocumentoDescargable } from "@/sanity/lib/types";
import { pickLocale } from "@/lib/locale";
import { CarnetSocio } from "@/components/CarnetSocio";
import { CuentaLogin } from "./CuentaLogin";
import { CuentaAcciones } from "./CuentaAcciones";
import { SolicitarCarnet } from "./SolicitarCarnet";
import { CancelarCuota } from "./CancelarCuota";
import { SubirFoto } from "./SubirFoto";

const ESTADO_LABEL: Record<string, { es: string; eu: string; cls: string }> = {
  activo:    { es: "Activo",          eu: "Aktiboa",         cls: "bg-green-100 text-green-800" },
  pendiente: { es: "Pendiente",       eu: "Zain",            cls: "bg-amber-100 text-amber-800" },
  moroso:    { es: "Pago pendiente",  eu: "Ordainketa zain", cls: "bg-red-100 text-red-800" },
  baja:      { es: "Baja",            eu: "Baja",            cls: "bg-neutral-100 text-neutral-600" },
};

const PAGO_LABEL: Record<string, { es: string; cls: string }> = {
  pagado:       { es: "Pagado",      cls: "bg-green-100 text-green-800" },
  pendiente:    { es: "Pendiente",   cls: "bg-amber-100 text-amber-800" },
  fallido:      { es: "Fallido",     cls: "bg-red-100 text-red-800" },
  reembolsado:  { es: "Reembolsado", cls: "bg-neutral-100 text-neutral-600" },
};

const CATEGORIA_NOTICIA: Record<string, string> = {
  "socios":        "Socios",
  "club":          "Club",
  "primer-equipo": "1er equipo",
  "cantera":       "Cantera",
};

const VENTAJAS = [
  { es: "Entrada gratuita a todos los partidos en casa",    eu: "Sarrera doan etxeko partido guztietan" },
  { es: "Voto en la Asamblea General del club",             eu: "Boto Batzar Nagusian" },
  { es: "Carné digital y físico de socio",                  eu: "Bazkide karnet digitala eta fisikoa" },
  { es: "Comunicaciones y novedades exclusivas del club",   eu: "Klubaren komunikazio eta berri esklusiboak" },
];

function mesAbr(fecha: string, locale: string) {
  return new Date(fecha).toLocaleDateString(locale === "eu" ? "eu-ES" : "es-ES", { month: "short" }).toUpperCase().replace(".", "");
}
function diaMes(fecha: string) {
  return new Date(fecha).getDate();
}
function formatFecha(fecha: string, locale: string) {
  return new Date(fecha).toLocaleDateString(locale === "eu" ? "eu-ES" : "es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default async function CuentaPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";
  const titulo = eu ? "Nire kuota" : "Mi cuota";

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  const admin = createAdminClient();

  // .limit(1) en vez de .maybeSingle(): un email duplicado entre dos socios
  // (dato antiguo mal cargado) haría que .maybeSingle() lance un error y
  // deje a esa persona sin poder entrar a su portal.
  const { data: sociosCoincidentes } = await admin
    .from("socios")
    .select("id, nombre, apellidos, numero_socio, estado, fecha_alta, direccion, carnet_token, foto_url, carnet_fisico_pedido_en, carnet_fisico_entregado_en, carnet_fisico_recogida, stripe_customer_id, stripe_subscription_id, titular_id, tipos_abono(nombre, precio_cents)")
    .ilike("email", user.email)
    .order("numero_socio", { ascending: true })
    .limit(1);
  const socio = sociosCoincidentes?.[0] ?? null;

  // Estado real de la suscripción en Stripe: si ya hay una cancelación
  // programada, y la fecha en la que dejará de renovarse.
  let cancelacionProgramada = false;
  let fechaFinPeriodo: string | null = null;
  if (socio?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(socio.stripe_subscription_id);
      cancelacionProgramada = sub.cancel_at_period_end;
      const finPeriodo = sub.items.data[0]?.current_period_end;
      if (finPeriodo) fechaFinPeriodo = formatFecha(new Date(finPeriodo * 1000).toISOString(), locale);
    } catch {
      // Suscripción no encontrada en Stripe: no bloquea el portal.
    }
  }

  const [eventos, noticias, documentos] = await Promise.all([
    sanityFetch<Evento[]>(eventosProximosQuery, {}, []),
    sanityFetch<Noticia[]>(noticiasRecientesQuery, {}, []),
    sanityFetch<DocumentoDescargable[]>(documentosSociosQuery, {}, []),
  ]);

  const pagos = socio
    ? (await admin.from("pagos").select("id, importe_cents, estado, metodo, temporada, fecha, stripe_hosted_invoice_url").eq("socio_id", socio.id).order("fecha", { ascending: false }).limit(5)).data ?? []
    : [];

  // 2º carné de un abono familiar: los pagos y la facturación van por la
  // cuenta del titular, así que lo indicamos para que no extrañe ver el
  // historial vacío o no tener botón de "gestionar mi cuota".
  const titular = socio?.titular_id
    ? (await admin.from("socios").select("nombre, apellidos").eq("id", socio.titular_id).maybeSingle()).data
    : null;

  const tipo = (socio as { tipos_abono?: { nombre: string; precio_cents: number } | null } | null)?.tipos_abono;
  const eventosMostrar = eventos.slice(0, 3);

  return (
    <>
      <PageHeader title={titulo} />
      <div className="container max-w-5xl py-10 md:py-14">
        {socio ? (
          <div className="space-y-6">
            {/* Banner bienvenida */}
            <div className="rounded-2xl bg-azul px-6 py-5">
              <p className="text-sm text-white/70">{eu ? "Ongi etorri," : "Bienvenido/a,"}</p>
              <p className="font-display text-xl font-bold text-white">
                {socio.nombre} {socio.apellidos}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs text-white">
                  {eu ? "Bazkide nº" : "Socio nº"} {socio.numero_socio}
                </span>
                {socio.fecha_alta && (
                  <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs text-white">
                    {eu ? "Bazkide" : "Socio/a desde"} {formatFecha(socio.fecha_alta, locale)}
                  </span>
                )}
                {tipo && (
                  <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs text-white">
                    {tipo.nombre} · {(tipo.precio_cents / 100).toFixed(0)} €/{eu ? "urte" : "año"}
                  </span>
                )}
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${ESTADO_LABEL[socio.estado]?.cls ?? "bg-white/15 text-white"}`}>
                  {ESTADO_LABEL[socio.estado]?.[eu ? "eu" : "es"] ?? socio.estado}
                </span>
                {fechaFinPeriodo && !titular && (
                  <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs text-white">
                    {cancelacionProgramada
                      ? (eu ? "Baja: " : "Se da de baja: ")
                      : (eu ? "Hurrengo berritzea: " : "Próxima renovación: ")}
                    {fechaFinPeriodo}
                  </span>
                )}
              </div>
            </div>

            {/* 2º carné de un abono familiar: la facturación va por el titular */}
            {titular && (
              <div className="rounded-xl border border-azul-100 bg-azul-50 px-4 py-3 text-sm text-azul-800">
                {eu
                  ? `Familia-abonu baten zati zara (titularra: ${titular.nombre} ${titular.apellidos}). Ordainketak eta fakturazioa haren kontutik kudeatzen dira.`
                  : `Formas parte de un abono familiar (titular: ${titular.nombre} ${titular.apellidos}). Los pagos y la facturación se gestionan desde su cuenta.`}
              </div>
            )}

            {/* Grid 2 columnas */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr]">

              {/* Columna izquierda */}
              <div className="space-y-6">

                {/* Carné digital */}
                <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {eu ? "Karnet digitala" : "Carné digital"}
                  </p>
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
                  <SubirFoto />
                </section>

                {/* Próximos eventos */}
                <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {eu ? "Hurrengo ekitaldiak" : "Próximos eventos"}
                  </p>
                  {eventosMostrar.length > 0 ? (
                    <ul className="divide-y divide-neutral-100">
                      {eventosMostrar.map((ev) => (
                        <li key={ev._id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="flex w-10 flex-shrink-0 flex-col items-center rounded-lg bg-rojo py-1.5 text-white">
                            <span className="text-[10px] leading-none opacity-80">{mesAbr(ev.fecha, locale)}</span>
                            <span className="font-display text-lg font-bold leading-tight">{diaMes(ev.fecha)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">
                              {pickLocale(ev.titulo, locale)}
                            </p>
                            {ev.lugar && (
                              <p className="truncate text-xs text-neutral-500">{ev.lugar}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-neutral-400">
                      {eu ? "Ez dago ekitaldirik aurreikusita." : "No hay eventos próximos programados."}
                    </p>
                  )}
                </section>

                {/* Últimas noticias */}
                <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {eu ? "Azken berriak" : "Últimas noticias"}
                  </p>
                  {noticias.length > 0 ? (
                    <ul className="divide-y divide-neutral-100">
                      {noticias.map((n) => (
                        <li key={n._id} className="py-3 first:pt-0 last:pb-0">
                          <Link
                            href={`/noticias/${n.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-500">
                                {CATEGORIA_NOTICIA[n.categoria] ?? n.categoria}
                              </span>
                              <p className="mt-1 truncate text-sm font-semibold text-neutral-900 group-hover:text-azul">
                                {pickLocale(n.titulo, locale)}
                              </p>
                              <p className="text-xs text-neutral-400">{formatFecha(n.fecha, locale)}</p>
                            </div>
                            <span className="mt-1 flex-shrink-0 text-neutral-300 group-hover:text-azul">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-neutral-400">
                      {eu ? "Ez dago berririk oraindik." : "No hay noticias publicadas todavía."}
                    </p>
                  )}
                </section>

              </div>

              {/* Columna derecha */}
              <div className="space-y-6">

                {/* Historial de pagos */}
                <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {eu ? "Ordainketa historia" : "Historial de pagos"}
                  </p>
                  {pagos.length > 0 ? (
                    <ul className="divide-y divide-neutral-100">
                      {pagos.map((p) => {
                        const lbl = PAGO_LABEL[p.estado];
                        return (
                          <li key={p.id} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                            <div>
                              <p className="text-sm font-semibold text-neutral-900">
                                {p.temporada ?? formatFecha(p.fecha, locale)}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {p.metodo === "card" ? (eu ? "Txartela" : "Tarjeta") : p.metodo === "sepa_debit" ? "SEPA" : "—"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-neutral-900">
                                {((p.importe_cents ?? 0) / 100).toFixed(2)} €
                              </p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lbl?.cls ?? ""}`}>
                                {lbl?.es ?? p.estado}
                              </span>
                              {p.stripe_hosted_invoice_url && (
                                <a
                                  href={p.stripe_hosted_invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 block text-[10px] font-semibold text-azul underline hover:text-azul-700"
                                >
                                  {eu ? "Faktura ikusi" : "Ver factura"}
                                </a>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-neutral-400">
                      {eu ? "Ez dago ordainketarik erregistratuta." : "No hay pagos registrados todavía."}
                    </p>
                  )}
                </section>

                {/* Ventajas del socio */}
                <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {eu ? "Zure abantailak" : "Tus ventajas"}
                  </p>
                  <ul className="space-y-2">
                    {VENTAJAS.map((v, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="mt-0.5 font-bold text-azul">✓</span>
                        {eu ? v.eu : v.es}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Documentos */}
                {documentos.length > 0 && (
                  <section className="rounded-2xl border border-neutral-200 bg-white p-6">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      {eu ? "Dokumentuak" : "Documentos"}
                    </p>
                    <ul className="space-y-2">
                      {documentos.map((doc) => (
                        <li key={doc._id}>
                          <a
                            href={doc.url ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 rounded-lg p-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-azul"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-rojo">↓</span>
                              {pickLocale(doc.titulo, locale)}
                            </span>
                            <span className="text-xs text-neutral-400">PDF</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Solicitar carné físico */}
                <SolicitarCarnet
                  pedidoEn={socio.carnet_fisico_pedido_en ?? null}
                  entregadoEn={socio.carnet_fisico_entregado_en ?? null}
                  recogida={socio.carnet_fisico_recogida ?? null}
                  tieneDireccion={!!socio.direccion}
                />

                {/* Gestionar cuota + cerrar sesión */}
                <CuentaAcciones tienePago={!!socio.stripe_customer_id} />

                {/* Cancelar la cuota: solo el titular que paga (no el 2º
                    carné del abono familiar) puede cancelarla. */}
                {socio.stripe_customer_id && !titular && (
                  <CancelarCuota
                    cancelacionProgramada={cancelacionProgramada}
                    fechaFinPeriodo={fechaFinPeriodo}
                  />
                )}

              </div>
            </div>
          </div>
        ) : (
          /* Socio no encontrado */
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
