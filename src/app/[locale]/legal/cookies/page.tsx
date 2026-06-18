import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function CookiesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  return (
    <>
      <PageHeader
        title={eu ? "Cookie-politika" : "Política de Cookies"}
        intro={eu ? "Webguneak nola erabiltzen dituen cookieak" : "Cómo utiliza cookies este sitio web"}
      />
      <div className="container max-w-3xl py-12 md:py-16">
        {eu && (
          <div className="mb-8 rounded-xl border border-azul-200 bg-azul-50 p-5 text-sm text-azul-700">
            Dokumentu hau gaztelaniaz bakarrik dago eskuragarri, arrazoi juridikoengatik.
          </div>
        )}
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-azul-800 prose-a:text-azul prose-a:no-underline hover:prose-a:underline">
          <p className="text-sm text-neutral-500">Última actualización: junio de 2026</p>

          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que los sitios web guardan en tu navegador cuando
            los visitas. Permiten recordar información entre páginas y sesiones, y son imprescindibles para
            que determinadas funcionalidades —como mantener la sesión iniciada— funcionen correctamente.
          </p>

          <h2>2. Cookies que utilizamos</h2>
          <p>
            El sitio web <strong>www.cdberriz.com</strong> utiliza únicamente cookies técnicas estrictamente
            necesarias para su funcionamiento. No utilizamos cookies de publicidad, seguimiento de
            comportamiento ni análisis de terceros.
          </p>

          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Finalidad</th>
                <th>Duración</th>
                <th>Proveedor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>sb-[ref]-auth-token</code></td>
                <td>Técnica necesaria</td>
                <td>Mantiene la sesión iniciada del socio en el portal</td>
                <td>1 año</td>
                <td>Supabase (cdberriz.com)</td>
              </tr>
              <tr>
                <td><code>NEXT_LOCALE</code></td>
                <td>Técnica necesaria</td>
                <td>Recuerda el idioma seleccionado (castellano/euskera)</td>
                <td>1 año</td>
                <td>cdberriz.com</td>
              </tr>
            </tbody>
          </table>

          <h2>3. Cookies de terceros</h2>
          <p>
            Este sitio <strong>no instala cookies de terceros</strong> para publicidad, análisis de
            comportamiento ni redes sociales. Los botones de redes sociales del footer son simples
            enlaces externos y no generan cookies en tu navegador.
          </p>

          <h2>4. ¿Necesitamos tu consentimiento?</h2>
          <p>
            Las cookies que utilizamos son <strong>técnicas y estrictamente necesarias</strong> para
            prestar el servicio solicitado. Conforme al artículo 22.2 de la LSSI-CE y la guía de la
            AEPD, estas cookies no requieren consentimiento previo, ya que son indispensables para el
            funcionamiento del sitio.
          </p>
          <p>
            No obstante, puedes desactivarlas desde la configuración de tu navegador, si bien esto puede
            afectar al funcionamiento del portal de socios (no podrás iniciar sesión).
          </p>

          <h2>5. ¿Cómo gestionar o desactivar las cookies?</h2>
          <p>Puedes eliminar o bloquear cookies desde la configuración de tu navegador:</p>
          <ul>
            <li>
              <strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros
              datos de sitios
            </li>
            <li>
              <strong>Mozilla Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del
              sitio
            </li>
            <li>
              <strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web
            </li>
            <li>
              <strong>Microsoft Edge:</strong> Configuración → Privacidad, búsqueda y servicios →
              Cookies
            </li>
          </ul>
          <p>
            Para más información sobre cómo gestionar cookies en otros navegadores, visita{" "}
            <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">
              www.aboutcookies.org
            </a>
            .
          </p>

          <h2>6. Más información</h2>
          <p>
            Para cualquier consulta sobre el uso de cookies en este sitio, puedes contactarnos en{" "}
            <a href="mailto:infocdberriz@gmail.com">infocdberriz@gmail.com</a>. Puedes consultar también
            nuestra <a href="/legal/privacidad">Política de Privacidad</a> para conocer cómo tratamos tus
            datos personales.
          </p>

          <h2>7. Actualizaciones de esta política</h2>
          <p>
            El Club Deportivo Berriz puede actualizar esta Política de Cookies para reflejar cambios
            técnicos o normativos. La versión vigente estará siempre disponible en esta página.
          </p>
        </div>
      </div>
    </>
  );
}
