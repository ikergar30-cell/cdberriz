import Image from "next/image";
import { Link } from "@/i18n/routing";

// Sección promocional del carnet digital de socio. Mockup de móvil flotante
// (animación CSS, sin librerías) con un carnet de ejemplo. Datos ficticios y QR
// placeholder: NO usa datos reales de socios. Colores corporativos del club.
export function CarnetDigitalPromo({ locale }: { locale: string }) {
  const eu = locale === "eu";

  return (
    <section className="overflow-hidden rounded-3xl bg-azul-50 p-8 md:p-10">
      <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        {/* Texto + llamada a la acción */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rojo px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {eu ? "Eskuragarri" : "Ya disponible"}
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-azul-700 md:text-3xl">
            {eu ? (
              <>
                Jada eskuragarri <span className="whitespace-nowrap">C.D. Berrizko</span> bazkide karnet digitala!
              </>
            ) : (
              <>
                ¡Ya disponible el carnet digital de socio del{" "}
                <span className="whitespace-nowrap">C.D. Berriz!</span>
              </>
            )}
          </h2>
          <p className="mt-3 max-w-md text-azul-800/80">
            {eu
              ? "Eraman zure karneta beti zurekin mugikorrean. Sartu Berrizburuko partidetara zure QR kodea erakutsiz, paperik gabe."
              : "Lleva tu carnet siempre contigo en el móvil. Accede a los partidos en Berrizburu mostrando tu código QR, sin papeles."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cuenta"
              className="inline-flex items-center justify-center rounded-full bg-azul px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-700"
            >
              {eu ? "Nire karneta ikusi" : "Ver mi carnet"}
            </Link>
            <a
              href="#cuotas"
              className="inline-flex items-center justify-center rounded-full border border-azul-200 bg-white px-6 py-2.5 text-sm font-semibold text-azul transition hover:border-azul"
            >
              {eu ? "Egin zaitez bazkide" : "Hazte socio/a"}
            </a>
          </div>
        </div>

        {/* Mockup de móvil flotante */}
        <div className="flex justify-center [perspective:900px]">
          <div
            className="[transform:rotateY(-22deg)_rotateX(10deg)] [transform-style:preserve-3d]"
          >
            <div className="carnet-flotar relative h-[380px] w-[200px] rounded-[28px] border-2 border-azul-800 bg-azul-900 p-1.5 shadow-2xl">
              {/* Notch + iconos de estado */}
              <div className="absolute left-1/2 top-2.5 z-10 h-1.5 w-14 -translate-x-1/2 rounded-md bg-azul-900" />
              <div className="absolute right-3.5 top-2 z-10 flex gap-1.5 text-white/50">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
                <svg width="15" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                  <line x1="23" y1="13" x2="23" y2="11" />
                  <rect x="3" y="8" width="10" height="8" fill="currentColor" stroke="none" />
                </svg>
              </div>

              {/* Pantalla */}
              <div className="flex h-full w-full flex-col overflow-hidden rounded-[22px] bg-white">
                {/* Cabecera con escudo */}
                <div className="bg-azul px-3 pb-4 pt-6 text-center">
                  <Image
                    src="/escudo-blanco.png"
                    alt=""
                    width={60}
                    height={72}
                    className="mx-auto mb-2 h-12 w-auto"
                  />
                  <p className="text-sm font-semibold tracking-wide text-white">
                    {eu ? "Bazkide karneta" : "Carnet de socio"}
                  </p>
                </div>

                {/* Cuerpo: QR + datos */}
                <div className="flex flex-1 flex-col items-center justify-center px-3.5 py-3">
                  <div className="mb-3 h-24 w-24 rounded-lg border border-azul-100 bg-white p-1.5">
                    {/* QR placeholder (no funcional) */}
                    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
                      <rect width="100" height="100" fill="white" />
                      <g fill="#0A2F4D">
                        <rect x="6" y="6" width="22" height="22" /><rect x="11" y="11" width="12" height="12" fill="white" /><rect x="14" y="14" width="6" height="6" fill="#0A2F4D" />
                        <rect x="72" y="6" width="22" height="22" /><rect x="77" y="11" width="12" height="12" fill="white" /><rect x="80" y="14" width="6" height="6" fill="#0A2F4D" />
                        <rect x="6" y="72" width="22" height="22" /><rect x="11" y="77" width="12" height="12" fill="white" /><rect x="14" y="80" width="6" height="6" fill="#0A2F4D" />
                        <rect x="38" y="6" width="6" height="6" /><rect x="50" y="6" width="6" height="12" /><rect x="62" y="12" width="6" height="6" />
                        <rect x="6" y="38" width="6" height="6" /><rect x="18" y="38" width="12" height="6" /><rect x="38" y="38" width="12" height="12" /><rect x="56" y="44" width="6" height="6" /><rect x="68" y="38" width="6" height="12" /><rect x="82" y="38" width="12" height="6" />
                        <rect x="6" y="56" width="6" height="12" /><rect x="24" y="56" width="6" height="6" /><rect x="44" y="62" width="12" height="6" /><rect x="62" y="56" width="6" height="6" /><rect x="80" y="56" width="6" height="12" />
                        <rect x="38" y="74" width="6" height="12" /><rect x="50" y="80" width="12" height="6" /><rect x="68" y="74" width="6" height="6" /><rect x="80" y="80" width="6" height="6" />
                      </g>
                    </svg>
                  </div>
                  <p className="text-center text-[15px] font-semibold text-azul-800">Eduardo Urcelay</p>
                  <p className="mb-3 text-xs text-azul-400">{eu ? "Bazkide zk." : "Socio nº"} 0001</p>
                  <div className="flex w-full gap-1.5">
                    <div className="flex-1 rounded-md bg-azul-50 p-1.5 text-center">
                      <p className="text-[8px] uppercase tracking-wide text-azul-300">{eu ? "Kuota" : "Cuota"}</p>
                      <p className="text-[10px] font-semibold text-azul-800">Individual</p>
                    </div>
                    <div className="flex-1 rounded-md bg-azul-50 p-1.5 text-center">
                      <p className="text-[8px] uppercase tracking-wide text-azul-300">{eu ? "Denboraldia" : "Temporada"}</p>
                      <p className="text-[10px] font-semibold text-azul-800">2025-26</p>
                    </div>
                  </div>
                </div>

                {/* Franja de estado */}
                <div className="bg-dorado py-2 text-center">
                  <p className="text-[10px] font-semibold text-dorado-900">
                    ✓ {eu ? "Bazkide aktiboa" : "Socio activo"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animación de flotación (se desactiva con prefers-reduced-motion) */}
      <style>{`
        @keyframes carnetFlotar { 0%,100%{transform:translateY(-5px)} 50%{transform:translateY(7px)} }
        .carnet-flotar { animation: carnetFlotar 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .carnet-flotar { animation: none; } }
      `}</style>
    </section>
  );
}
