"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { cancelarMiCuota, reactivarMiCuota } from "./actions";
import { ERROR_GENERICO } from "@/lib/actionResult";

const MOTIVOS = [
  { valor: "precio", es: "Es demasiado caro", eu: "Garestiegia da" },
  { valor: "no_uso", es: "Ya no voy a los partidos / no tengo tiempo", eu: "Jada ez naiz partidetara joaten / ez dut denborarik" },
  { valor: "mudanza", es: "Me he mudado / vivo lejos", eu: "Mugitu naiz / urrun bizi naiz" },
  { valor: "disconformidad", es: "No estoy conforme con el club", eu: "Ez nago klubarekin ados" },
  { valor: "otro", es: "Otro motivo", eu: "Beste arrazoi bat" },
] as const;

type Paso = "cerrado" | "motivo" | "retencion" | "confirmado";

export function CancelarCuota({
  cancelacionProgramada,
  fechaFinPeriodo,
}: {
  cancelacionProgramada: boolean;
  fechaFinPeriodo: string | null;
}) {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();

  const [paso, setPaso] = useState<Paso>("cerrado");
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reactivar() {
    setCargando(true);
    setError(null);
    try {
      const resultado = await reactivarMiCuota();
      if (resultado?.error) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    } catch {
      setError(ERROR_GENERICO);
    } finally {
      setCargando(false);
    }
  }

  async function confirmarCancelacion() {
    setCargando(true);
    setError(null);
    try {
      const resultado = await cancelarMiCuota(motivo, comentario);
      if (resultado?.error) {
        setError(resultado.error);
        return;
      }
      setPaso("confirmado");
      router.refresh();
    } catch {
      setError(ERROR_GENERICO);
    } finally {
      setCargando(false);
    }
  }

  // Ya hay una cancelación programada: ofrecer deshacerla.
  if (cancelacionProgramada) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">
          {eu
            ? `Zure berritzea bertan behera dago. ${fechaFinPeriodo ?? ""} arte aktibo jarraituko duzu.`
            : `Tu renovación está cancelada. Seguirás siendo socio/a activo hasta el ${fechaFinPeriodo ?? "final del periodo pagado"}.`}
        </p>
        <button
          onClick={reactivar}
          disabled={cargando}
          className="mt-2 font-semibold underline disabled:opacity-60"
        >
          {cargando ? "…" : eu ? "Berritzea leheneratu" : "Deshacer cancelación"}
        </button>
        {error && <p className="mt-2 text-sm font-semibold text-rojo">{error}</p>}
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";

  if (paso === "cerrado") {
    return (
      <button
        onClick={() => setPaso("motivo")}
        className="text-sm font-semibold text-neutral-400 underline hover:text-rojo"
      >
        {eu ? "Nire kuota baja eman" : "Cancelar mi cuota"}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      {paso === "motivo" && (
        <>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-neutral-700">
            {eu ? "Zergatik utzi nahi duzu?" : "¿Por qué quieres cancelar?"}
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            {eu
              ? "Zure erantzunak klubari lagunduko dio hobetzen."
              : "Tu respuesta nos ayuda a mejorar. No afecta a tu baja."}
          </p>
          <div className="mt-3 space-y-2">
            {MOTIVOS.map((m) => (
              <label key={m.valor} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  name="motivo"
                  value={m.valor}
                  checked={motivo === m.valor}
                  onChange={() => setMotivo(m.valor)}
                  className="accent-azul"
                />
                {eu ? m.eu : m.es}
              </label>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={eu ? "Iruzkina (aukerakoa)" : "Cuéntanos más (opcional)"}
            rows={2}
            className={`mt-3 ${input}`}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setPaso("retencion")}
              disabled={!motivo}
              className="rounded-full bg-azul px-5 py-2 text-sm font-semibold text-white transition hover:bg-azul-700 disabled:opacity-40"
            >
              {eu ? "Jarraitu" : "Continuar"}
            </button>
            <button
              onClick={() => setPaso("cerrado")}
              className="text-sm font-semibold text-neutral-500 hover:text-neutral-800"
            >
              {eu ? "Atzera" : "Volver"}
            </button>
          </div>
        </>
      )}

      {paso === "retencion" && (
        <>
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-azul-700">
            {eu ? "Itxaron, mesedez" : "Antes de irte…"}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="text-azul">✓</span>
              {eu
                ? "Zure kuotak zuzenean klubaren harrobia laguntzen du."
                : "Tu cuota apoya directamente a la cantera y a todos los equipos del club."}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-azul">✓</span>
              {eu
                ? "Prezioarekin arazoak badituzu, jarri gurekin harremanetan — irtenbide bat bilatuko dugu."
                : "Si el motivo es el precio, escríbenos antes de cancelar — seguro que encontramos una solución."}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-azul">✓</span>
              {eu
                ? "Baja ematen baduzu, zure bazkide zenbakia ez da inori esleituko."
                : "Si cancelas, seguirás activo/a hasta el final del periodo que ya has pagado — no pierdes nada de lo abonado."}
            </li>
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            {eu
              ? "Kontaktua: "
              : "Contacto: "}
            <a href="mailto:infocdberriz@gmail.com" className="font-semibold text-azul underline">
              infocdberriz@gmail.com
            </a>
          </p>

          {error && (
            <p className="mt-3 text-sm font-semibold text-rojo">{error}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setPaso("cerrado")}
              className="rounded-full bg-azul px-5 py-2 text-sm font-semibold text-white transition hover:bg-azul-700"
            >
              {eu ? "Bazkide izaten jarraitu" : "Seguir siendo socio/a"}
            </button>
            <button
              onClick={confirmarCancelacion}
              disabled={cargando}
              className="rounded-full border border-rojo px-5 py-2 text-sm font-semibold text-rojo transition hover:bg-rojo hover:text-white disabled:opacity-60"
            >
              {cargando ? "…" : eu ? "Hala ere, baja eman" : "Aun así, cancelar"}
            </button>
          </div>
        </>
      )}

      {paso === "confirmado" && (
        <p className="text-sm text-neutral-700">
          {eu
            ? "Zure berritzea bertan behera utzi da. Dagoeneko ordaindutako epea amaitu arte aktibo jarraituko duzu."
            : "Tu renovación ha quedado cancelada. Seguirás activo/a hasta el final del periodo ya pagado."}
        </p>
      )}
    </div>
  );
}
