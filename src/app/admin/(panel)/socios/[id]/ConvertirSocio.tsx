"use client";

import { useState } from "react";
import { convertirCuotaManual, enviarEnlacePago } from "../actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

interface TipoAbonoOpcion {
  id: string;
  nombre: string;
  precio_cents: number;
}

const METODOS = [
  { valor: "sepa_debit", label: "SEPA por Stripe (alta automática con el IBAN)" },
  { valor: "sepa_banco", label: "Domiciliación bancaria directa (fuera de Stripe)" },
  { valor: "manual", label: "Manual / en mano (fuera de Stripe)" },
];

export function ConvertirSocio({ socioId, tipos, tieneEmail }: { socioId: string; tipos: TipoAbonoOpcion[]; tieneEmail: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<"cobrar" | "enlace">("enlace");
  const [tipoAbonoId, setTipoAbonoId] = useState(tipos[0]?.id ?? "");
  const [metodoPago, setMetodoPago] = useState("sepa_debit");
  const [iban, setIban] = useState("");
  const [fechaInicioCobro, setFechaInicioCobro] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlaceEnviado, setEnlaceEnviado] = useState<string | null>(null);

  const muestraIban = metodoPago === "sepa_debit" || metodoPago === "sepa_banco";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      if (modo === "enlace") {
        const fd = new FormData();
        fd.set("tipo_abono_id", tipoAbonoId);
        const r = await enviarEnlacePago(socioId, fd);
        if (r.error) setError(r.error);
        else setEnlaceEnviado(r.enlace ?? null);
      } else {
        const fd = new FormData();
        fd.set("tipo_abono_id", tipoAbonoId);
        fd.set("metodo_pago", metodoPago);
        fd.set("iban", iban);
        fd.set("fecha_inicio_cobro", fechaInicioCobro);
        const r = await convertirCuotaManual(socioId, fd);
        if (r?.error) setError(r.error);
        // Sin error: la acción hace redirect() a la ficha ya actualizada.
      }
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) {
        return;
      }
      setError(ERROR_GENERICO);
    } finally {
      setCargando(false);
    }
  }

  if (enlaceEnviado) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <p className="font-semibold">Enlace de pago enviado por email.</p>
        <p className="mt-1 break-all text-xs text-green-700">{enlaceEnviado}</p>
      </div>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full bg-dorado px-4 py-2 text-sm font-semibold text-azul-900 transition hover:bg-dorado-600"
      >
        Convertir en socio de pago
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 font-display text-sm font-bold uppercase text-neutral-900">
        Convertir en socio de pago
      </p>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setModo("enlace")}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
            modo === "enlace" ? "border-azul bg-azul-50 text-azul-700" : "border-neutral-300 text-neutral-500"
          }`}
        >
          Enviarle un enlace de pago
        </button>
        <button
          type="button"
          onClick={() => setModo("cobrar")}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
            modo === "cobrar" ? "border-azul bg-azul-50 text-azul-700" : "border-neutral-300 text-neutral-500"
          }`}
        >
          Cobrar aquí (tengo los datos)
        </button>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-neutral-600">Cuota</label>
        <select
          value={tipoAbonoId}
          onChange={(e) => setTipoAbonoId(e.target.value)}
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
        >
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} ({(t.precio_cents / 100).toFixed(2)} €/año)
            </option>
          ))}
        </select>
      </div>

      {modo === "enlace" ? (
        !tieneEmail ? (
          <p className="rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            Este socio no tiene email guardado: no se le puede enviar el enlace. Añádeselo primero
            desde &quot;Editar datos&quot;, o usa &quot;Cobrar aquí&quot;.
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            Se le enviará un email con un enlace de pago de Stripe (tarjeta o SEPA) para que
            complete él mismo el alta.
          </p>
        )
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-600">Método de pago</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            >
              {METODOS.map((m) => (
                <option key={m.valor} value={m.valor}>{m.label}</option>
              ))}
            </select>
          </div>
          {muestraIban && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">IBAN</label>
              <input
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
                required
                style={{ fontFamily: "monospace" }}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
              />
            </div>
          )}
          {metodoPago === "sepa_debit" && (
            <>
              {!tieneEmail && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  Este socio necesita un email guardado para darlo de alta en Stripe.
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">
                  Fecha de primer cobro (opcional)
                </label>
                <input
                  type="date"
                  value={fechaInicioCobro}
                  onChange={(e) => setFechaInicioCobro(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
                />
                <p className="mt-1 text-xs text-neutral-400">Vacío = cobrar ahora mismo.</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-xs font-semibold text-rojo">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={cargando || (modo === "enlace" && !tieneEmail) || (modo === "cobrar" && metodoPago === "sepa_debit" && !tieneEmail)}
          className="rounded-full bg-rojo px-5 py-2 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
        >
          {cargando ? "…" : modo === "enlace" ? "Enviar enlace" : "Dar de alta el pago"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm font-semibold text-neutral-500 underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
