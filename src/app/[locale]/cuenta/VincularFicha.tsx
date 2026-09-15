"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { vincularMiEmail } from "./actions";

// Se muestra cuando la persona ha iniciado sesión (email verificado) pero su
// email todavía no está en ninguna ficha de socio. Le pedimos su DNI o número
// de socio para vincular su email a su ficha (solo si esa ficha no tiene ya
// otro email, ver vincularMiEmail).
export function VincularFicha({ email }: { email: string }) {
  const locale = useLocale();
  const eu = locale === "eu";
  const t = (es: string, txtEu: string) => (eu ? txtEu : es);
  const router = useRouter();

  const [valor, setValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const r = await vincularMiEmail(valor);
      if (r?.error) setError(r.error);
      else router.refresh();
    } catch {
      setError(t("Ha ocurrido un error. Inténtalo de nuevo.", "Errore bat gertatu da. Saiatu berriro."));
    } finally {
      setCargando(false);
    }
  }

  async function salir() {
    await createClient().auth.signOut();
    router.refresh();
  }

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";

  return (
    <section className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 md:p-8">
      <h2 className="font-display text-xl font-bold text-neutral-900">
        {t("Vincula tu ficha de socio", "Lotu zure bazkide-fitxa")}
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        {t(
          `Has entrado como ${email}, pero ese email todavía no está asociado a ninguna ficha. Escribe tu DNI o número de socio para vincularlo.`,
          `${email} gisa sartu zara, baina email hori ez dago oraindik inongo fitxari lotuta. Idatzi zure NANa edo bazkide zenbakia lotzeko.`,
        )}
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <input
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={t("DNI o número de socio", "NANa edo bazkide zenbakia")}
          className={input}
          required
          autoFocus
        />
        {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60"
        >
          {cargando ? "…" : t("Vincular", "Lotu")}
        </button>
      </form>
      <p className="mt-4 text-xs text-neutral-500">
        {t(
          "¿No sabes tu número de socio, tu ficha ya tiene otro email o no eres socio/a?",
          "Ez dakizu zure bazkide zenbakia, zure fitxak beste email bat du edo ez zara bazkidea?",
        )}
      </p>
      <Link
        href="/contacto"
        className="mt-3 inline-block rounded-full border border-azul px-5 py-2.5 text-sm font-semibold text-azul transition hover:bg-azul hover:text-white"
      >
        {t("Contactar con el club", "Klubarekin harremanetan jarri")}
      </Link>
      <button type="button" onClick={salir} className="mt-4 block text-sm font-semibold text-neutral-500 underline hover:text-neutral-800">
        {t("Cerrar sesión", "Saioa itxi")}
      </button>
    </section>
  );
}
