"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { OrigenSocio, Socio, TipoAbono, EstadoSocio } from "@/lib/supabase/types";
import { ERROR_GENERICO, type ActionResult } from "@/lib/actionResult";

const ESTADOS: { valor: EstadoSocio; label: string }[] = [
  { valor: "activo", label: "Activo" },
  { valor: "pendiente", label: "Pendiente" },
  { valor: "moroso", label: "Moroso" },
  { valor: "baja", label: "Baja" },
];

const METODOS = [
  { valor: "", label: "— Sin asignar —" },
  { valor: "sepa_debit", label: "SEPA (domiciliación bancaria)" },
  { valor: "card", label: "Tarjeta (gestiona Stripe)" },
  { valor: "manual", label: "Manual / fuera de Stripe" },
];

const ORIGENES: { valor: OrigenSocio; label: string }[] = [
  { valor: "cuota", label: "Paga cuota de socio/a" },
  { valor: "jugador", label: "Tiene un hijo/a jugando en el club" },
];

export interface SocioParaTitular {
  id: string;
  nombre: string;
  apellidos: string;
  numero_socio: number;
}

function etiquetaTitular(s: SocioParaTitular) {
  return `${s.nombre} ${s.apellidos} — nº${s.numero_socio}`;
}

export function SocioForm({
  socio,
  tipos,
  accion,
  cancelarHref = "/admin/socios",
  sociosParaTitular = [],
}: {
  socio?: Socio;
  tipos: TipoAbono[];
  accion: (formData: FormData) => Promise<ActionResult>;
  cancelarHref?: string;
  /** Resto de socios, para poder buscar y vincular como titular de un bono familiar. */
  sociosParaTitular?: SocioParaTitular[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [metodoPago, setMetodoPago] = useState(socio?.metodo_pago ?? "");

  const titularActual = sociosParaTitular.find((s) => s.id === socio?.titular_id) ?? null;
  const [esSegundoTitular, setEsSegundoTitular] = useState(Boolean(socio?.titular_id));
  const [titularId, setTitularId] = useState(socio?.titular_id ?? "");
  const [busquedaTitular, setBusquedaTitular] = useState(titularActual ? etiquetaTitular(titularActual) : "");
  // Si esta persona ya tenía suscripción propia y la conviertes en 2º
  // titular, hay que cancelarla explícitamente — si no, se le seguiría
  // cobrando aparte, duplicado con lo que pague el titular nuevo.
  const tieneSuscripcionPropia = Boolean(socio?.stripe_subscription_id);

  const mapaTitular = useMemo(() => {
    const m = new Map<string, SocioParaTitular>();
    for (const s of sociosParaTitular) {
      if (s.id === socio?.id) continue; // no puede ser titular de sí mismo
      m.set(etiquetaTitular(s), s);
    }
    return m;
  }, [sociosParaTitular, socio?.id]);

  async function onSubmit(formData: FormData) {
    setError(null);
    setGuardando(true);
    try {
      const resultado = await accion(formData);
      if (resultado?.error) {
        setError(resultado.error);
        setGuardando(false);
      }
      // Sin error: la acción ya ha hecho redirect().
    } catch (e) {
      // El propio redirect() de Next lanza esta señal interna; no es un error.
      if (
        e &&
        typeof e === "object" &&
        "digest" in e &&
        String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        return;
      }
      setError(ERROR_GENERICO);
      setGuardando(false);
    }
  }

  const esSepa = metodoPago === "sepa_debit";
  const esNuevo = !socio;

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const label = "mb-1 block text-sm font-semibold text-neutral-700";

  return (
    <form action={onSubmit} className="max-w-2xl space-y-6">

      {/* ── Datos personales ── */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Datos personales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="nombre">Nombre *</label>
            <input id="nombre" name="nombre" defaultValue={socio?.nombre} className={input} required />
          </div>
          <div>
            <label className={label} htmlFor="apellidos">Apellidos *</label>
            <input id="apellidos" name="apellidos" defaultValue={socio?.apellidos} className={input} required />
          </div>
          <div>
            <label className={label} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={socio?.email ?? ""} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="telefono">Teléfono</label>
            <input id="telefono" name="telefono" defaultValue={socio?.telefono ?? ""} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="dni">DNI / NIF</label>
            <input id="dni" name="dni" defaultValue={socio?.dni ?? ""} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
            <input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              defaultValue={socio?.fecha_nacimiento ?? ""}
              className={input}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="direccion">Dirección</label>
            <input id="direccion" name="direccion" defaultValue={socio?.direccion ?? ""} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="poblacion">Población</label>
            <input id="poblacion" name="poblacion" defaultValue={socio?.poblacion ?? ""} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="codigo_postal">Código postal</label>
            <input id="codigo_postal" name="codigo_postal" defaultValue={socio?.codigo_postal ?? ""} className={input} />
          </div>
        </div>
      </section>

      {/* ── Abono y estado ── */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Abono y estado
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="origen">¿Por qué es socio/a?</label>
            <select id="origen" name="origen" defaultValue={socio?.origen ?? "cuota"} className={input}>
              {ORIGENES.map((o) => (
                <option key={o.valor} value={o.valor}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={socio?.estado ?? "pendiente"} className={input}>
              {ESTADOS.map((e) => (
                <option key={e.valor} value={e.valor}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="tipo_abono_id">Cuota</label>
            <select
              id="tipo_abono_id"
              name="tipo_abono_id"
              defaultValue={socio?.tipo_abono_id ?? ""}
              className={input}
              disabled={esSegundoTitular}
            >
              <option value="">— Sin asignar —</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({(t.precio_cents / 100).toFixed(2)} €)
                </option>
              ))}
            </select>
            {esSegundoTitular && (
              <p className="mt-1 text-xs text-neutral-400">
                Es 2º titular de un bono familiar: paga quien figura como titular.
              </p>
            )}
          </div>
          <div>
            <label className={label} htmlFor="fecha_alta">Fecha de alta</label>
            <input
              id="fecha_alta"
              name="fecha_alta"
              type="date"
              defaultValue={socio?.fecha_alta ?? (socio ? "" : new Date().toISOString().slice(0, 10))}
              className={input}
            />
          </div>
        </div>
      </section>

      {/* ── Bono familiar ── */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Bono familiar
        </h2>
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={esSegundoTitular}
            onChange={(e) => {
              const marcado = e.target.checked;
              setEsSegundoTitular(marcado);
              if (!marcado) {
                setTitularId("");
                setBusquedaTitular("");
              }
            }}
          />
          Es 2º titular de un bono familiar (paga otro socio/a por él/ella)
        </label>

        {esSegundoTitular && (
          <div className="mt-3">
            <label className={label} htmlFor="titular_busqueda">Titular que paga</label>
            <input
              id="titular_busqueda"
              list="titular-options"
              placeholder="Escribe el nombre o número de socio…"
              className={input}
              value={busquedaTitular}
              onChange={(e) => {
                setBusquedaTitular(e.target.value);
                const match = mapaTitular.get(e.target.value);
                setTitularId(match?.id ?? "");
              }}
            />
            <datalist id="titular-options">
              {sociosParaTitular
                .filter((s) => s.id !== socio?.id)
                .map((s) => (
                  <option key={s.id} value={etiquetaTitular(s)} />
                ))}
            </datalist>
            <input type="hidden" name="titular_id" value={titularId} />
            {busquedaTitular && !titularId && (
              <p className="mt-1 text-xs font-semibold text-rojo">
                No coincide con ningún socio/a de la lista. Elige una opción del desplegable.
              </p>
            )}
          </div>
        )}

        {esSegundoTitular && tieneSuscripcionPropia && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Esta persona ya tiene una suscripción de pago activa.</p>
            <p className="mt-1">
              Al guardar se cancelará su renovación automática — no se le volverá a cobrar por
              su cuenta, sigue activa hasta el final del periodo ya pagado. Si el titular nuevo
              debe pasar a la cuota familiar, cámbiaselo a él por separado en su propia ficha.
            </p>
            <label className="mt-2 flex items-center gap-2 font-semibold">
              <input type="checkbox" name="confirmar_cancelacion_stripe" required />
              Entendido, cancela su suscripción al guardar
            </label>
          </div>
        )}
      </section>

      {/* ── Pago / Stripe ── */}
      {!esSegundoTitular && (
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Método de pago
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="metodo_pago">Método</label>
            <select
              id="metodo_pago"
              name="metodo_pago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className={input}
            >
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>{m.label}</option>
              ))}
            </select>
          </div>

          {esSepa && (
            <>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="iban">IBAN *</label>
                <input
                  id="iban"
                  name="iban"
                  placeholder="ES00 0000 0000 0000 0000 0000"
                  defaultValue={socio?.iban ?? ""}
                  className={input}
                  required={esSepa && esNuevo}
                  style={{ fontFamily: "monospace" }}
                />
              </div>
              {esNuevo && (
                <div>
                  <label className={label} htmlFor="fecha_inicio_cobro">
                    Fecha de primer cobro
                  </label>
                  <input
                    id="fecha_inicio_cobro"
                    name="fecha_inicio_cobro"
                    type="date"
                    className={input}
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    Si es futura, Stripe cobra en esa fecha. Déjalo vacío para cobrar ahora.
                  </p>
                </div>
              )}
              {esNuevo && (
                <div className="sm:col-span-2 rounded-xl border border-azul-200 bg-azul-50 p-4 text-sm text-azul-800">
                  <strong>Alta en Stripe:</strong> al guardar se creará automáticamente el cliente
                  en Stripe, se vinculará el IBAN y se configurará la suscripción anual.
                  El socio recibirá un email de Stripe confirmando el mandato SEPA.
                </div>
              )}
            </>
          )}
        </div>
      </section>
      )}

      {/* ── Familia y notas ── */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Otros
        </h2>
        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="miembros_familia">
              Miembros de la familia (abono familiar) — uno por línea
            </label>
            <textarea
              id="miembros_familia"
              name="miembros_familia"
              rows={3}
              defaultValue={(socio?.miembros_familia ?? []).map((m) => m.nombre).join("\n")}
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="notas">Notas internas</label>
            <textarea id="notas" name="notas" rows={3} defaultValue={socio?.notas ?? ""} className={input} />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-rojo/30 bg-rojo-50 p-4 text-sm font-semibold text-rojo">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
        >
          {guardando
            ? esSepa && esNuevo
              ? "Creando en Stripe…"
              : "Guardando…"
            : socio
              ? "Guardar cambios"
              : "Crear socio"}
        </button>
        <Link href={cancelarHref} className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
