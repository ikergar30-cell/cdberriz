"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CUOTAS, type ClaveCuota } from "@/config/cuotas";
import { cuotaEfectiva, calcularEdad } from "@/lib/edad";
import { pickLocale } from "@/lib/locale";

export function AltaForm({ clave }: { clave: ClaveCuota }) {
  const locale = useLocale();
  const eu = locale === "eu";
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fechaNac, setFechaNac] = useState("");
  const [fechaNac2, setFechaNac2] = useState("");

  // El abono familiar incluye DOS carnets: se piden también los datos
  // mínimos del segundo titular en el mismo formulario.
  const esFamiliar = clave === "familiar";

  // Calcula en vivo qué cuota le corresponde por edad (solo informativo;
  // el precio real lo decide el servidor).
  const efectiva = fechaNac ? (cuotaEfectiva(clave, fechaNac) as ClaveCuota) : clave;
  const cambia = efectiva !== clave;
  const edad = fechaNac ? calcularEdad(fechaNac) : null;
  const edad2 = fechaNac2 ? calcularEdad(fechaNac2) : null;

  // Ser socio implica un contrato con pago recurrente: un menor no puede
  // contraerlo por sí solo, y el uso de su imagen (LO 1/1996) exige el
  // consentimiento expreso de su padre/madre/tutor legal.
  const hayMenor = (edad !== null && edad < 18) || (esFamiliar && edad2 !== null && edad2 < 18);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const datos = Object.fromEntries(new FormData(e.currentTarget).entries());
    const mensajeGenerico = eu
      ? "Ez da bideratu. Berriz saiatu edo jarri gurekin harremanetan."
      : "No se pudo continuar. Inténtalo de nuevo o ponte en contacto con nosotros.";
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, clave, locale }),
      });
      // El servidor siempre responde JSON, pero si algo imprevisto lo
      // impidiera (caída puntual, proxy, etc.) no queremos enseñar el error
      // técnico de "res.json()" tal cual — el texto exacto varía incluso
      // según el navegador y no dice nada útil al socio.
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.url) throw new Error(json?.error || mensajeGenerico);
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : mensajeGenerico);
      setCargando(false);
    }
  }

  const t = {
    nombre: eu ? "Izena" : "Nombre",
    apellidos: eu ? "Abizenak" : "Apellidos",
    email: "Email",
    telefono: eu ? "Telefonoa" : "Teléfono",
    fechaNac: eu ? "Jaiotze-data" : "Fecha de nacimiento",
    direccion: eu ? "Helbidea" : "Dirección",
    poblacion: eu ? "Herria" : "Población",
    codigoPostal: eu ? "Posta-kodea" : "Código postal",
    dni: eu ? "NAN / NIE" : "DNI / NIE",
    segundoTitular: eu ? "Bigarren titularra" : "Segundo titular",
    segundoTitularNota: eu
      ? "Familia-abonuak bi bazkide-txartel ditu. Bete bigarren titularraren datuak."
      : "El abono familiar incluye dos carnets de socio. Rellena los datos del segundo titular.",
    email2: eu ? "Emaila (aukerakoa)" : "Email (opcional)",
    email2Nota: eu
      ? "Jarriz gero, bigarren titularrak bere kontu propioa izango du webgunean bere karnet digitala ikusteko."
      : "Si lo indicas, el segundo titular podrá entrar con su propia cuenta en la web para ver su carné digital.",
    continuar: eu ? "Ordaintzera joan" : "Ir al pago",
    aviso: eu
      ? "Ordainketa segurua Striperekin. Txartelez edo banku-helbideratzez (SEPA)."
      : "Pago seguro con Stripe. Con tarjeta o domiciliación bancaria (SEPA).",
    rgpd: eu
      ? "Irakurri eta onartzen dut Pribatutasun-politika eta bazkide gisa nire datuak tratatzeko baimena ematen dut."
      : "He leído y acepto la Política de Privacidad y autorizo el tratamiento de mis datos para la gestión de mi condición de socio/a.",
    imagen: eu
      ? "C.D. Berrizek nire irudia erabiltzeko baimena ematen dut bere kanal ofizialetan argitaratutako argazki eta bideo-an (sare sozialak, web, argitalpenak)."
      : "Autorizo al C.D. Berriz a utilizar mi imagen en fotos y vídeos publicados en sus canales oficiales (redes sociales, web, publicaciones del club).",
    privacidadLink: eu ? "Pribatutasun-politika" : "Política de Privacidad",
    bases: eu
      ? "Irakurri eta onartzen dut bazkideen "
      : "He leído y acepto las ",
    basesLink: eu ? "baldintzak" : "condiciones de socios/as",
    tutorLegal: eu
      ? "Adin nagusitasunik gabeko bazkide baten alta egiten ari zara. Adierazten dut haren aita, ama edo tutore legala naizela eta bere izenean ematen dudala baimen hau, bazkidetza-kontratua eta bere irudia erabiltzeko baimena barne (1996ko urtarrilaren 15eko 1/1996 Lege Organikoa)."
      : "Estás dando de alta a un socio/a menor de edad. Declaro ser su padre, madre o tutor/a legal y prestar en su nombre este consentimiento, incluyendo el contrato de socio y la autorización de uso de su imagen (conforme a la Ley Orgánica 1/1996).",
  };

  const input =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const label = "mb-1 block text-sm font-semibold text-neutral-700";
  // Safari/iOS pinta su propio fondo gris en los <input type="date"> si no se
  // fuerza a que ignore el estilo nativo del sistema.
  const inputDateStyle = { WebkitAppearance: "none", appearance: "none", colorScheme: "light" } as const;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nombre">{t.nombre} *</label>
          <input id="nombre" name="nombre" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="apellidos">{t.apellidos} *</label>
          <input id="apellidos" name="apellidos" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="email">{t.email} *</label>
          <input id="email" name="email" type="email" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="telefono">{t.telefono} *</label>
          <input id="telefono" name="telefono" type="tel" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="fecha_nacimiento">{t.fechaNac} *</label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            className={input}
            style={inputDateStyle}
            value={fechaNac}
            onChange={(e) => setFechaNac(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="dni">{t.dni} *</label>
          <input id="dni" name="dni" className={input} required />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="direccion">{t.direccion} *</label>
        <input id="direccion" name="direccion" className={input} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="poblacion">{t.poblacion} *</label>
          <input id="poblacion" name="poblacion" className={input} required />
        </div>
        <div>
          <label className={label} htmlFor="codigo_postal">{t.codigoPostal} *</label>
          <input
            id="codigo_postal"
            name="codigo_postal"
            className={input}
            inputMode="numeric"
            pattern="\d{5}"
            title={eu ? "5 zenbaki" : "5 dígitos"}
            required
          />
        </div>
      </div>

      {/* Segundo titular del abono familiar (datos mínimos para su carnet) */}
      {esFamiliar && (
        <div className="rounded-xl border border-azul-200 bg-azul-50/40 p-4">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-azul-700">
            {t.segundoTitular}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{t.segundoTitularNota}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="nombre2">{t.nombre} *</label>
              <input id="nombre2" name="nombre2" className={input} required />
            </div>
            <div>
              <label className={label} htmlFor="apellidos2">{t.apellidos} *</label>
              <input id="apellidos2" name="apellidos2" className={input} required />
            </div>
            <div>
              <label className={label} htmlFor="dni2">{t.dni} *</label>
              <input id="dni2" name="dni2" className={input} required />
            </div>
            <div>
              <label className={label} htmlFor="fecha_nacimiento2">{t.fechaNac} *</label>
              <input
                id="fecha_nacimiento2"
                name="fecha_nacimiento2"
                type="date"
                className={input}
                style={inputDateStyle}
                value={fechaNac2}
                onChange={(e) => setFechaNac2(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="email2">{t.email2}</label>
              <input id="email2" name="email2" type="email" className={input} />
              <p className="mt-1 text-xs text-neutral-500">{t.email2Nota}</p>
            </div>
          </div>
        </div>
      )}

      {/* Aviso si por edad le corresponde otra cuota */}
      {cambia && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {eu
            ? `Zure adina dela eta (${edad} urte), dagokizun abonua ${pickLocale(
                CUOTAS[efectiva].nombre,
                locale,
              )} da (${CUOTAS[efectiva].precio} €/urte).`
            : `Por tu edad (${edad} años), te corresponde el abono ${pickLocale(
                CUOTAS[efectiva].nombre,
                locale,
              )} (${CUOTAS[efectiva].precio} €/año). Es lo que se cobrará.`}
        </div>
      )}

      {/* Consentimientos */}
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="acepta_rgpd" required className="mt-0.5 h-4 w-4 shrink-0 accent-azul" />
          <span className="text-xs text-neutral-600 leading-relaxed">
            *{" "}{t.rgpd}{" "}
            <a href={`/${locale}/legal/privacidad`} target="_blank" rel="noopener noreferrer" className="text-azul underline">
              {t.privacidadLink}
            </a>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="autoriza_imagen" required className="mt-0.5 h-4 w-4 shrink-0 accent-azul" />
          <span className="text-xs text-neutral-600 leading-relaxed">
            * {t.imagen}
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="acepta_bases" required className="mt-0.5 h-4 w-4 shrink-0 accent-azul" />
          <span className="text-xs text-neutral-600 leading-relaxed">
            * {t.bases}{" "}
            <a href={`/${locale}/legal/condiciones-socios`} target="_blank" rel="noopener noreferrer" className="text-azul underline">
              {t.basesLink}
            </a>
          </span>
        </label>
        {hayMenor && (
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-amber-200 bg-amber-50 p-3">
            <input
              type="checkbox"
              name="autoriza_tutor"
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-azul"
            />
            <span className="text-xs font-medium text-amber-900 leading-relaxed">
              * {t.tutorLegal}
            </span>
          </label>
        )}
      </div>

      {error && <p className="text-sm font-semibold text-rojo">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-full bg-rojo px-6 py-3 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60 sm:w-auto"
      >
        {cargando ? "…" : t.continuar}
      </button>
      <p className="text-xs text-neutral-500">{t.aviso}</p>
    </form>
  );
}
