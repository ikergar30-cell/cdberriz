import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { REEMBOLSO_DIAS, diasDesde } from "@/config/reembolso";
import type { CarnetFisico, EstadoPago, Pago, Socio, TipoAbono } from "@/lib/supabase/types";
import { CarnetSocio } from "@/components/CarnetSocio";
import { camposFaltantes } from "@/lib/socios/camposFaltantes";
import { etiquetaTipoSocio } from "@/config/origenSocio";
import { proximoCierreTemporada } from "@/config/facturacion";
import { HistorialPagos } from "./HistorialPagos";
import { AccionesAbono } from "./AccionesAbono";
import { ConvertirSocio } from "./ConvertirSocio";

const ESTADO_BADGE: Record<Socio["estado"], string> = {
  activo: "bg-green-100 text-green-700",
  pendiente: "bg-amber-100 text-amber-700",
  moroso: "bg-rojo-50 text-rojo",
  baja: "bg-neutral-100 text-neutral-500",
};

const ESTADO_LABEL: Record<Socio["estado"], string> = {
  activo: "Activo",
  pendiente: "Pendiente",
  moroso: "Moroso",
  baja: "Baja",
};

const METODO_LABEL: Record<string, string> = {
  sepa_debit: "SEPA por Stripe",
  sepa_banco: "Domiciliación bancaria directa",
  card: "Tarjeta",
  manual: "Manual / fuera de Stripe",
  stripe: "Stripe",
};

// Debe coincidir con las claves usadas en el cuestionario de baja del
// portal (src/app/[locale]/cuenta/CancelarCuota.tsx).
const MOTIVO_BAJA_LABEL: Record<string, string> = {
  precio: "Es demasiado caro",
  no_uso: "Ya no va a los partidos / no tiene tiempo",
  mudanza: "Se ha mudado / vive lejos",
  disconformidad: "No está conforme con el club",
  otro: "Otro motivo",
};

function formatearFecha(fecha: string | number) {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

export interface FilaFactura {
  id: string;
  fecha: number;
  importe_cents: number;
  estado: EstadoPago;
  temporada: string | null;
  metodo: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

export default async function FichaSocioPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: socio }, { data: tipos }, { data: pagos }, { data: carnetsHist }, { data: entradasHist }] =
    await Promise.all([
      supabase.from("socios").select("*").eq("id", id).single(),
      supabase.from("tipos_abono").select("*").eq("activo", true).order("orden"),
      supabase.from("pagos").select("*").eq("socio_id", id).order("fecha", { ascending: false }),
      supabase
        .from("carnets_fisicos")
        .select("id, temporada, solicitado_en, entregado_en")
        .eq("socio_id", id)
        .order("solicitado_en", { ascending: false }),
      supabase
        .from("entradas")
        .select("id, creado_en")
        .eq("socio_id", id)
        .order("creado_en", { ascending: false }),
    ]);

  if (!socio) notFound();

  const s = socio as Socio;
  const cuota = (tipos as TipoAbono[] | null)?.find((t) => t.id === s.tipo_abono_id) ?? null;
  const listaPagos = (pagos as Pago[]) ?? [];
  const historialCarnets = (carnetsHist as CarnetFisico[]) ?? [];
  const historialEntradas = (entradasHist as { id: string; creado_en: string }[]) ?? [];

  const admin = createAdminClient();

  // Si es el 2º carné de un abono familiar, mostramos también quién es el titular.
  let titular: Pick<Socio, "id" | "nombre" | "apellidos"> | null = null;
  if (s.titular_id) {
    const { data } = await admin
      .from("socios")
      .select("id, nombre, apellidos")
      .eq("id", s.titular_id)
      .maybeSingle();
    titular = data;
  }

  // Si ES titular, mostramos a quién más le paga el bono familiar.
  const { data: dependientes } = await supabase
    .from("socios")
    .select("id, nombre, apellidos, numero_socio")
    .eq("titular_id", id);

  // "Por hijo/a jugando" y sin cuota asignada todavía: no le aplica nada de
  // pago/Stripe, así que esas secciones se ocultan y en su lugar se ofrece
  // "Convertir en socio de pago".
  const esJugadorPuro = s.origen === "jugador" && !s.tipo_abono_id;

  // Hijos/as vinculados a este socio (tabla "jugadores"), con el otro
  // padre/madre si también es socio — misma idea que en el portal del socio.
  const { data: hijos } = await admin
    .from("jugadores")
    .select("id, nombre, apellidos, equipo, madre_socio_id, padre_socio_id")
    .or(`madre_socio_id.eq.${id},padre_socio_id.eq.${id}`);
  const otroIds = Array.from(
    new Set(
      (hijos ?? [])
        .map((h) => (h.madre_socio_id === id ? h.padre_socio_id : h.madre_socio_id))
        .filter((otroId): otroId is string => Boolean(otroId) && otroId !== id),
    ),
  );
  const { data: otrosPadres } =
    otroIds.length > 0
      ? await admin.from("socios").select("id, nombre, apellidos, numero_socio").in("id", otroIds)
      : { data: [] };
  const otroPadrePorId = new Map((otrosPadres ?? []).map((p) => [p.id, p]));

  // Estado real de la suscripción en Stripe (fuente de verdad para la fecha
  // de próxima renovación y si hay una cancelación ya programada).
  let proximaRenovacion: number | null = null;
  let cancelacionProgramada = false;
  if (s.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(s.stripe_subscription_id);
      // Desde la API 2025+ de Stripe, "current_period_end" vive en cada
      // subscription item, no en la suscripción directamente.
      const finPeriodo = sub.items.data[0]?.current_period_end;
      proximaRenovacion = finPeriodo ? finPeriodo * 1000 : null;
      cancelacionProgramada = sub.cancel_at_period_end;
    } catch {
      // Suscripción no encontrada/cancelada en Stripe: no bloquea la ficha.
    }
  }
  // Sin suscripción de Stripe real (domiciliación bancaria, alta manual):
  // se muestra igualmente la próxima fecha objetivo (1 de julio) como
  // referencia, para quien esté activo y pague alguna cuota.
  const proximaRenovacionGenerica =
    !proximaRenovacion && s.estado === "activo" && cuota
      ? proximoCierreTemporada(new Date()).getTime()
      : null;

  // "Todos los pagos y facturas de Stripe": la tabla local "pagos" solo se
  // rellena con los eventos de webhook que hemos recibido, así que puede
  // faltar alguno (fallo puntual, factura antigua, etc.). Para garantizar que
  // se ve TODO, pedimos directamente a Stripe el listado de facturas del
  // cliente (fuente de verdad) y lo enriquecemos con lo que ya sabemos en
  // local (temporada, método, y si está reembolsada — Stripe sigue llamando
  // "paid" a una factura reembolsada; ese estado lo llevamos nosotros).
  const localPorFactura = new Map(listaPagos.map((p) => [p.stripe_invoice_id, p]));
  let facturas: FilaFactura[] = [];
  if (s.stripe_customer_id) {
    try {
      const invoices = await stripe.invoices.list({ customer: s.stripe_customer_id, limit: 100 });
      facturas = invoices.data
        .filter((inv) => inv.status !== "draft")
        .map((inv) => {
          const local = localPorFactura.get(inv.id ?? "");
          let estado: EstadoPago = "fallido";
          if (local?.estado === "reembolsado") estado = "reembolsado";
          else if (inv.status === "paid") estado = "pagado";
          else if (inv.status === "open") estado = "pendiente";
          return {
            id: inv.id ?? crypto.randomUUID(),
            fecha: inv.created * 1000,
            importe_cents: inv.amount_paid || inv.total,
            estado,
            temporada: local?.temporada ?? null,
            metodo: local?.metodo ?? null,
            hostedUrl: inv.hosted_invoice_url ?? null,
            pdfUrl: inv.invoice_pdf ?? null,
          };
        });
    } catch {
      // Cliente no encontrado en Stripe (p. ej. datos de prueba): no bloquea la ficha.
    }
  }

  const faltan = camposFaltantes(s);
  const ultimoPago = listaPagos.find((p) => p.estado === "pagado") ?? null;
  const diasTranscurridos = ultimoPago ? diasDesde(ultimoPago.fecha) : Infinity;
  // Derecho de desistimiento (14 días): además del plazo, el socio no debe
  // haber usado ya el carné (cada entrada válida en el control de acceso
  // queda registrada en "entradas").
  const haUsadoCarnet = historialEntradas.length > 0;
  const elegibleReembolso = ultimoPago !== null && diasTranscurridos <= REEMBOLSO_DIAS && !haUsadoCarnet;
  const diasRestantesReembolso = elegibleReembolso
    ? Math.max(0, Math.ceil(REEMBOLSO_DIAS - diasTranscurridos))
    : null;

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/socios" className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
        ← Volver a socios
      </Link>

      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold uppercase text-neutral-900">
            {s.nombre} {s.apellidos}
          </h1>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_BADGE[s.estado]}`}>
            {ESTADO_LABEL[s.estado]}
          </span>
          {(() => {
            const tipo = etiquetaTipoSocio(s.origen, Boolean(s.tipo_abono_id));
            return (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tipo.badge}`}>
                {tipo.label}
              </span>
            );
          })()}
          {s.carnet_fisico_pedido_en && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                s.carnet_fisico_entregado_en
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {s.carnet_fisico_entregado_en ? "Carné físico listo/entregado" : "Carné físico solicitado"}
            </span>
          )}
        </div>
        <Link
          href={`/admin/socios/${id}/editar`}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-azul hover:text-azul"
        >
          Editar datos
        </Link>
      </div>

      {faltan.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Faltan datos por rellenar:</strong> {faltan.join(", ")}.{" "}
          <Link href={`/admin/socios/${id}/editar`} className="font-semibold underline">
            Completar ahora
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
        <div className="space-y-6">
          {/* ── Su abono ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
              Su abono
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">Socio nº</dt>
                <dd className="mt-0.5 text-sm text-neutral-800">
                  {s.numero_socio}
                  {s.estado === "baja" && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">
                      (retirado, no se reasigna)
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">Cuota</dt>
                <dd className="mt-0.5 text-sm text-neutral-800">
                  {cuota
                    ? `${cuota.nombre} (${(cuota.precio_cents / 100).toFixed(2)} €/año)`
                    : s.origen === "jugador"
                      ? "Hijo/a jugador/a (sin cuota aparte)"
                      : "Sin asignar"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">Fecha de alta</dt>
                <dd className="mt-0.5 text-sm text-neutral-800">
                  {s.fecha_alta ? formatearFecha(s.fecha_alta) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">
                  {cancelacionProgramada ? "Se da de baja el" : "Próxima renovación"}
                </dt>
                <dd className="mt-0.5 text-sm text-neutral-800">
                  {proximaRenovacion
                    ? formatearFecha(proximaRenovacion)
                    : proximaRenovacionGenerica
                      ? formatearFecha(proximaRenovacionGenerica)
                      : "—"}
                  {cancelacionProgramada && (
                    <span className="ml-2 text-xs font-semibold text-rojo">(cancelada)</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-neutral-400">Método de pago</dt>
                <dd className="mt-0.5 text-sm text-neutral-800">
                  {s.metodo_pago ? METODO_LABEL[s.metodo_pago] ?? s.metodo_pago : "Sin asignar"}
                </dd>
              </div>
              {(s.metodo_pago === "sepa_debit" || s.metodo_pago === "sepa_banco") && s.iban && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-400">Número de cuenta (IBAN)</dt>
                  <dd className="mt-0.5 text-sm text-neutral-800" style={{ fontFamily: "monospace" }}>
                    {s.iban}
                  </dd>
                </div>
              )}
              {titular && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-neutral-400">
                    2º carné del abono familiar de
                  </dt>
                  <dd className="mt-0.5 text-sm text-neutral-800">
                    <Link href={`/admin/socios/${titular.id}`} className="text-azul hover:underline">
                      {titular.nombre} {titular.apellidos}
                    </Link>
                  </dd>
                </div>
              )}
              {dependientes && dependientes.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-neutral-400">
                    También paga el carné de
                  </dt>
                  <dd className="mt-0.5 space-x-3 text-sm text-neutral-800">
                    {dependientes.map((d) => (
                      <Link
                        key={d.id}
                        href={`/admin/socios/${d.id}`}
                        className="text-azul hover:underline"
                      >
                        {d.nombre} {d.apellidos} (nº{d.numero_socio})
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            {s.motivo_baja && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">
                  El socio solicitó cancelar
                  {s.fecha_solicitud_baja ? ` el ${formatearFecha(s.fecha_solicitud_baja)}` : ""}:{" "}
                  {MOTIVO_BAJA_LABEL[s.motivo_baja] ?? s.motivo_baja}
                </p>
                {s.comentario_baja && (
                  <p className="mt-1 italic text-amber-700">&ldquo;{s.comentario_baja}&rdquo;</p>
                )}
              </div>
            )}

            <AccionesAbono
              socioId={id}
              tieneSuscripcion={Boolean(s.stripe_subscription_id)}
              cancelacionProgramada={cancelacionProgramada}
              elegibleReembolso={elegibleReembolso}
              diasRestantesReembolso={diasRestantesReembolso}
              fechaFinPeriodo={proximaRenovacion ? formatearFecha(proximaRenovacion) : null}
              haUsadoCarnet={haUsadoCarnet}
            />

            {esJugadorPuro && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <ConvertirSocio
                  socioId={id}
                  tipos={(tipos as TipoAbono[] | null) ?? []}
                  tieneEmail={Boolean(s.email)}
                />
              </div>
            )}
          </div>

          {/* Hijos/as en el club (tabla "jugadores") */}
          {hijos && hijos.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
                Hijos/as en el club
              </h2>
              <ul className="mt-3 divide-y divide-neutral-100">
                {hijos.map((h) => {
                  const otroId = h.madre_socio_id === id ? h.padre_socio_id : h.madre_socio_id;
                  const otro = otroId ? otroPadrePorId.get(otroId) : null;
                  return (
                    <li key={h.id} className="py-2.5 text-sm">
                      <span className="font-semibold text-neutral-800">
                        {h.nombre} {h.apellidos}
                      </span>
                      <span className="text-neutral-500"> — {h.equipo || "sin equipo"}</span>
                      {otro && (
                        <span className="block text-xs text-neutral-400">
                          También socio/a por su hijo/a:{" "}
                          <Link href={`/admin/socios/${otro.id}`} className="text-azul hover:underline">
                            {otro.nombre} {otro.apellidos} (nº {otro.numero_socio})
                          </Link>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!esJugadorPuro && <HistorialPagos facturas={facturas} tieneStripe={Boolean(s.stripe_customer_id)} />}

          {/* Histórico de carnés físicos */}
          {historialCarnets.length > 0 && (
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
                Carnés físicos
              </h2>
              <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Temporada</th>
                      <th className="px-4 py-3">Solicitado</th>
                      <th className="px-4 py-3">Entregado</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {historialCarnets.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 text-neutral-700">{c.temporada ?? "—"}</td>
                        <td className="px-4 py-3 text-neutral-600">{formatearFecha(c.solicitado_en)}</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {c.entregado_en ? formatearFecha(c.entregado_en) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {c.entregado_en ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              Entregado
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                              Solicitado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Entradas registradas (control de acceso a partidos) */}
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
              Entradas a partidos ({historialEntradas.length})
            </h2>
            {historialEntradas.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-400">Todavía no ha usado el carné para entrar.</p>
            ) : (
              <div className="mt-3 max-h-64 overflow-y-auto overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {historialEntradas.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 text-neutral-700">{formatearFecha(e.creado_en)}</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {new Date(e.creado_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

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
              cuota: cuota?.nombre ?? null,
            }}
            locale="es"
          />
        </div>
      </div>
    </div>
  );
}
