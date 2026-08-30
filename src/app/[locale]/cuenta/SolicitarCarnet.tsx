"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface Props {
  pedidoEn: string | null;
  entregadoEn: string | null;
  recogida: string | null;
  tieneDireccion: boolean;
  tieneFoto: boolean;
}

export function SolicitarCarnet({ pedidoEn, entregadoEn, recogida, tieneDireccion, tieneFoto }: Props) {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avisoEmail = eu
    ? "Prest dagoenean, emailez abisatuko dizugu jasotzeko."
    : "Te avisaremos por email en cuanto esté listo para recoger.";

  async function solicitar() {
    if (!tieneFoto) return;
    if (!tieneDireccion && !direccion.trim()) {
      setError(eu ? "Zure helbidea behar dugu." : "Introduce tu dirección.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/socios/solicitar-carnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion: direccion.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud.");
      setCargando(false);
    }
  }

  // Ya solicitado — mostrar el estado (solicitado / entregado).
  if (pedidoEn) {
    const fecha = new Date(pedidoEn).toLocaleDateString(eu ? "eu-ES" : "es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (entregadoEn) {
      const fechaEntrega = new Date(entregadoEn).toLocaleDateString(eu ? "eu-ES" : "es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="font-semibold text-green-800">
            {eu ? "Karnetaren egoera: Prest jasotzeko" : "Estado del carné: Listo para recoger"}
          </p>
          {recogida ? (
            <p className="mt-1 whitespace-pre-line text-sm text-green-700">{recogida}</p>
          ) : (
            <p className="mt-1 text-sm text-green-700">
              {eu
                ? `Berrizburun jasotzeko prest dago ${fechaEntrega}etik.`
                : `Listo para recoger en Berrizburu desde el ${fechaEntrega}.`}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-semibold text-amber-800">
          {eu ? "Karnetaren egoera: Eskatuta" : "Estado del carné: Solicitado"}
        </p>
        <p className="mt-1 text-sm text-amber-700">
          {eu
            ? `${fecha}an eskatu zenuen.`
            : `Solicitado el ${fecha}.`}{" "}
          {avisoEmail}
        </p>
      </div>
    );
  }

  // Antes de dejar solicitar el físico, animamos a usar el digital.
  if (!mostrarFormulario) {
    return (
      <div className="rounded-2xl border border-azul-200 bg-azul-50/60 p-6">
        <h2 className="font-display text-lg font-bold text-azul-800">
          {eu ? "Probatu duzu karnet digitala?" : "¿Ya has probado el carné digital?"}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          <li className="flex items-start gap-2">
            <span className="text-azul">✓</span>
            {eu
              ? "Beti zurekin, mugikorrean — ez duzu ahaztuko."
              : "Siempre contigo en el móvil — imposible olvidarlo en casa."}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-azul">✓</span>
            {eu
              ? "Segurua: QR pertsonala, ezin da faltsutu."
              : "Seguro: código QR personal, no se puede falsificar."}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-azul">✓</span>
            {eu
              ? "Berehalakoa: ez duzu itxaron behar postaz iritsi arte."
              : "Al instante: no hay que esperar a que llegue por correo."}
          </li>
        </ul>
        <p className="mt-3 text-sm text-neutral-500">
          {eu
            ? "Goiko \"Karnet digitala\" atalean duzu jada eskuragarri."
            : "Ya lo tienes disponible arriba, en \"Carné digital\"."}
        </p>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="mt-4 text-sm font-semibold text-neutral-500 underline hover:text-neutral-800"
        >
          {eu ? "Karnet fisikoa nahi dut hala ere" : "Aun así, quiero el carné físico"}
        </button>
      </div>
    );
  }

  // Pendiente de solicitar.
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-neutral-900">
        {eu ? "Karnet fisikoa eskatu" : "Solicitar carné físico"}
      </h2>

      {!tieneFoto ? (
        <p className="mt-1 text-sm font-semibold text-rojo">
          {eu
            ? "Lehenago zure argazkia igo behar duzu (goian, \"Karnet digitala\" atalean)."
            : "Antes tienes que subir tu foto (arriba, en \"Carné digital\")."}
        </p>
      ) : (
        <p className="mt-1 text-sm text-neutral-600">{avisoEmail}</p>
      )}

      {tieneFoto && !tieneDireccion && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-neutral-700">
            {eu ? "Helbidea (zure profila osatzeko)" : "Dirección (para completar tu perfil)"}
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder={eu ? "Kalea, zenbakia, herria…" : "Calle, número, localidad…"}
            maxLength={300}
            className="mt-1.5 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-azul-600 focus:ring-2 focus:ring-azul-200"
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-rojo">{error}</p>}

      <button
        onClick={solicitar}
        disabled={cargando || !tieneFoto}
        className="mt-4 rounded-full bg-azul px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700 disabled:opacity-60"
      >
        {cargando
          ? "…"
          : eu
            ? "Karnet fisikoa eskatu"
            : "Solicitar carné físico"}
      </button>
    </div>
  );
}
