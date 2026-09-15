"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  estadoCuenta,
  iniciarConContrasena,
  registrarSocio,
  verificarCodigoRegistro,
  reenviarCodigoRegistro,
  solicitarCodigoRecuperacion,
  verificarCodigoRecuperacion,
  establecerContrasena,
  iniciarSesionPortal,
} from "./actions";

type Paso =
  | "email"
  | "login"
  | "registro"
  | "codigo"
  | "recuperarCodigo"
  | "recuperarClave"
  | "enlace"
  | "enlaceEnviado"
  | "sinEmail";

export function CuentaLogin() {
  const locale = useLocale();
  const eu = locale === "eu";
  const t = (es: string, txtEu: string) => (eu ? txtEu : es);
  const router = useRouter();

  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const input =
    "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20";
  const boton =
    "w-full rounded-full bg-rojo px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rojo-600 disabled:opacity-60";
  const enlaceBtn = "text-sm font-semibold text-azul underline hover:text-azul-700";

  async function correr(fn: () => Promise<{ error?: string } | undefined | void>, alOk: () => void) {
    setError(null);
    setCargando(true);
    try {
      const r = await fn();
      if (r && "error" in r && r.error) setError(r.error);
      else alOk();
    } catch {
      setError(t("Ha ocurrido un error. Inténtalo de nuevo.", "Errore bat gertatu da. Saiatu berriro."));
    } finally {
      setCargando(false);
    }
  }

  // Paso 1: email → ¿tiene cuenta? login : registro
  function pasoEmail(e: React.FormEvent) {
    e.preventDefault();
    const correo = email.trim().toLowerCase();
    if (!correo.includes("@")) {
      setError(t("Escribe un email válido.", "Idatzi baliozko email bat."));
      return;
    }
    setEmail(correo);
    correr(
      async () => {
        const { existe } = await estadoCuenta(correo);
        setPaso(existe ? "login" : "registro");
      },
      () => {},
    );
  }

  function volverAEmail() {
    setPaso("email");
    setPassword("");
    setPassword2("");
    setCodigo("");
    setError(null);
    setAviso(null);
  }

  const cabeceraEmail = (
    <p className="text-sm text-neutral-500">
      {email}{" "}
      <button type="button" onClick={volverAEmail} className="ml-1 underline hover:text-neutral-800">
        {t("cambiar", "aldatu")}
      </button>
    </p>
  );

  // --- Pantallas -------------------------------------------------------------

  if (paso === "enlaceEnviado") {
    return (
      <div className="max-w-sm rounded-2xl border border-azul-200 bg-azul-50 p-6 text-azul-800">
        <p className="font-semibold">
          {t(
            "Si tu email está en nuestros registros, te hemos enviado un enlace. Haz clic en él para entrar.",
            "Zure emaila gure erregistroetan badago, esteka bat bidali dugu. Egin klik bertan sartzeko.",
          )}
        </p>
      </div>
    );
  }

  if (paso === "sinEmail") {
    return (
      <div className="max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-semibold">
          {t(
            "Hemos encontrado tu ficha, pero no tenemos ningún email guardado.",
            "Zure fitxa aurkitu dugu, baina ez daukagu zure emailik gordeta.",
          )}
        </p>
        <p className="mt-2 text-sm">
          {t(
            "Escribe tu email arriba y regístrate para crear tu acceso.",
            "Idatzi zure emaila goian eta erregistratu sarbidea sortzeko.",
          )}
        </p>
        <button type="button" onClick={volverAEmail} className={`mt-3 ${enlaceBtn}`}>
          {t("Volver", "Itzuli")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-4">
      {/* Paso EMAIL */}
      {paso === "email" && (
        <form onSubmit={pasoEmail} className="space-y-4">
          <p className="text-neutral-600">
            {t(
              "Escribe tu email para entrar o crear tu cuenta.",
              "Idatzi zure emaila sartzeko edo kontua sortzeko.",
            )}
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("Tu email", "Zure emaila")}
            className={input}
            autoComplete="email"
            required
          />
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "…" : t("Continuar", "Jarraitu")}
          </button>
          <button type="button" onClick={() => { setError(null); setPaso("enlace"); }} className={enlaceBtn}>
            {t("Prefiero entrar con un enlace", "Nahiago dut esteka batekin sartu")}
          </button>
        </form>
      )}

      {/* Paso LOGIN (cuenta existente) */}
      {paso === "login" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            correr(() => iniciarConContrasena(email, password), () => router.refresh());
          }}
          className="space-y-4"
        >
          {cabeceraEmail}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Tu contraseña", "Zure pasahitza")}
            className={input}
            autoComplete="current-password"
            required
            autoFocus
          />
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "…" : t("Entrar", "Sartu")}
          </button>
          <button
            type="button"
            onClick={() =>
              correr(
                () => solicitarCodigoRecuperacion(email, locale),
                () => {
                  setAviso(t("Te hemos enviado un código para recuperar tu contraseña.", "Kode bat bidali dizugu pasahitza berreskuratzeko."));
                  setPaso("recuperarCodigo");
                },
              )
            }
            className={enlaceBtn}
          >
            {t("¿Olvidaste tu contraseña?", "Pasahitza ahaztu duzu?")}
          </button>
          <p className="text-xs text-neutral-500">
            {t(
              "¿Antes entrabas con un enlace? Crea tu contraseña con «¿Olvidaste tu contraseña?».",
              "Lehen esteka batekin sartzen zinen? Sortu zure pasahitza «Pasahitza ahaztu duzu?» aukerarekin.",
            )}
          </p>
        </form>
      )}

      {/* Paso REGISTRO (cuenta nueva) */}
      {paso === "registro" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 8) {
              setError(t("La contraseña debe tener al menos 8 caracteres.", "Pasahitzak gutxienez 8 karaktere izan behar ditu."));
              return;
            }
            if (password !== password2) {
              setError(t("Las contraseñas no coinciden.", "Pasahitzak ez datoz bat."));
              return;
            }
            correr(
              () => registrarSocio(email, password, locale),
              () => {
                setAviso(t(`Te hemos enviado un código a ${email}.`, `Kode bat bidali dizugu hona: ${email}.`));
                setPaso("codigo");
              },
            );
          }}
          className="space-y-4"
        >
          {cabeceraEmail}
          <p className="text-sm text-neutral-600">
            {t("No tienes cuenta todavía. Crea una contraseña para registrarte.", "Ez daukazu konturik oraindik. Sortu pasahitz bat erregistratzeko.")}
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Crea una contraseña (mín. 8)", "Sortu pasahitza (gutx. 8)")}
            className={input}
            autoComplete="new-password"
            required
            autoFocus
          />
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder={t("Repite la contraseña", "Errepikatu pasahitza")}
            className={input}
            autoComplete="new-password"
            required
          />
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "…" : t("Crear cuenta", "Kontua sortu")}
          </button>
        </form>
      )}

      {/* Paso CÓDIGO (verificar registro) */}
      {paso === "codigo" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            correr(() => verificarCodigoRegistro(email, codigo), () => router.refresh());
          }}
          className="space-y-4"
        >
          {aviso && <p className="text-sm text-neutral-600">{aviso}</p>}
          <input
            type="text"
            inputMode="numeric"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder={t("Código del email", "Emaileko kodea")}
            className={`${input} tracking-widest`}
            autoComplete="one-time-code"
            required
            autoFocus
          />
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "…" : t("Verificar y entrar", "Egiaztatu eta sartu")}
          </button>
          <button
            type="button"
            onClick={() => correr(() => reenviarCodigoRegistro(email, locale), () => setAviso(t("Código reenviado.", "Kodea berriro bidali da.")))}
            className={enlaceBtn}
          >
            {t("Reenviar código", "Bidali kodea berriro")}
          </button>
        </form>
      )}

      {/* Paso RECUPERAR: código */}
      {paso === "recuperarCodigo" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            correr(() => verificarCodigoRecuperacion(email, codigo), () => { setCodigo(""); setPaso("recuperarClave"); });
          }}
          className="space-y-4"
        >
          {aviso && <p className="text-sm text-neutral-600">{aviso}</p>}
          <input
            type="text"
            inputMode="numeric"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder={t("Código del email", "Emaileko kodea")}
            className={`${input} tracking-widest`}
            autoComplete="one-time-code"
            required
            autoFocus
          />
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "…" : t("Continuar", "Jarraitu")}
          </button>
        </form>
      )}

      {/* Paso RECUPERAR: nueva contraseña */}
      {paso === "recuperarClave" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 8) {
              setError(t("La contraseña debe tener al menos 8 caracteres.", "Pasahitzak gutxienez 8 karaktere izan behar ditu."));
              return;
            }
            if (password !== password2) {
              setError(t("Las contraseñas no coinciden.", "Pasahitzak ez datoz bat."));
              return;
            }
            correr(() => establecerContrasena(password), () => router.refresh());
          }}
          className="space-y-4"
        >
          <p className="text-sm text-neutral-600">{t("Elige tu nueva contraseña.", "Aukeratu zure pasahitz berria.")}</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Nueva contraseña (mín. 8)", "Pasahitz berria (gutx. 8)")}
            className={input}
            autoComplete="new-password"
            required
            autoFocus
          />
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder={t("Repite la contraseña", "Errepikatu pasahitza")}
            className={input}
            autoComplete="new-password"
            required
          />
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "…" : t("Guardar y entrar", "Gorde eta sartu")}
          </button>
        </form>
      )}

      {/* Paso ENLACE (alternativa: enlace mágico) */}
      {paso === "enlace" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            correr(
              async () => {
                const r = await iniciarSesionPortal(email, locale);
                setPaso(r?.sinEmail ? "sinEmail" : "enlaceEnviado");
              },
              () => {},
            );
          }}
          className="space-y-4"
        >
          <p className="text-neutral-600">
            {t(
              "Escribe tu email, DNI o número de socio y te enviaremos un enlace de acceso.",
              "Idatzi zure emaila, NANa edo bazkide zenbakia eta sartzeko esteka bat bidaliko dizugu.",
            )}
          </p>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("Email, DNI o nº de socio", "Emaila, NANa edo bazkide zk.")}
            className={input}
            required
          />
          {error && <p className="text-sm font-semibold text-rojo">{error}</p>}
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "…" : t("Enviar enlace", "Bidali esteka")}
          </button>
          <button type="button" onClick={() => { setError(null); setPaso("email"); }} className={enlaceBtn}>
            {t("Entrar con email y contraseña", "Sartu email eta pasahitzarekin")}
          </button>
        </form>
      )}
    </div>
  );
}
