import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function PrivacidadPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  return (
    <>
      <PageHeader
        title={eu ? "Pribatutasun-politika" : "Política de Privacidad"}
        intro={eu ? "Zure datu pertsonalen tratamenduari buruzko informazioa" : "Información sobre el tratamiento de tus datos personales"}
      />
      <div className="container max-w-3xl py-12 md:py-16">
        {eu && (
          <div className="mb-8 rounded-xl border border-azul-200 bg-azul-50 p-5 text-sm text-azul-700">
            Dokumentu hau gaztelaniaz bakarrik dago eskuragarri, arrazoi juridikoengatik.
          </div>
        )}
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-azul-800 prose-a:text-azul prose-a:no-underline hover:prose-a:underline">
          <p className="text-sm text-neutral-500">Última actualización: junio de 2026</p>

          <h2>1. Responsable del tratamiento</h2>
          <ul>
            <li><strong>Identidad:</strong> Club Deportivo Berriz</li>
            <li><strong>CIF:</strong> G48309108</li>
            <li><strong>Domicilio:</strong> Calle Legaño 6, 48240 Berriz (Bizkaia)</li>
            <li><strong>Contacto:</strong> <a href="mailto:infocdberriz@gmail.com">infocdberriz@gmail.com</a></li>
            <li><strong>Teléfono:</strong> 692 076 167</li>
          </ul>

          <h2>2. Datos personales que tratamos</h2>
          <p>Según el servicio utilizado, tratamos los siguientes datos:</p>

          <h3>Socios del club</h3>
          <ul>
            <li>Nombre y apellidos</li>
            <li>Correo electrónico</li>
            <li>Teléfono (opcional)</li>
            <li>Fecha de nacimiento (para verificación de cuota por edad)</li>
            <li>Dirección postal (para envío del carnet físico)</li>
            <li>Fotografía del socio (opcional, para el carnet digital)</li>
            <li>Datos de pago gestionados por Stripe (el club no almacena datos bancarios directamente)</li>
            <li>Historial de pagos de cuotas</li>
          </ul>

          <h3>Formulario de contacto</h3>
          <ul>
            <li>Nombre</li>
            <li>Correo electrónico</li>
            <li>Mensaje</li>
          </ul>

          <h3>Jugadores (menores de edad)</h3>
          <p>
            Los datos de jugadores menores de edad (nombre, categoría, equipo) solo se recogen y publican
            previa obtención del consentimiento expreso de sus padres o tutores legales, conforme al
            artículo 8 del RGPD y la Ley Orgánica 3/2018.
          </p>

          <h3>Newsletter y suscriptores</h3>
          <p>
            Las personas que se suscriben al boletín de noticias a través del formulario del sitio web
            facilitan únicamente su dirección de correo electrónico. Estos datos se utilizan exclusivamente
            para el envío de comunicaciones sobre actividades y noticias del club. La base jurídica es el
            consentimiento del interesado (art. 6.1.a RGPD). El suscriptor puede darse de baja en cualquier
            momento a través del enlace habilitado en cada correo.
          </p>

          <h2>3. Finalidades y base jurídica del tratamiento</h2>

          <table>
            <thead>
              <tr>
                <th>Finalidad</th>
                <th>Base jurídica</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gestión de la relación con el socio (alta, renovación, baja)</td>
                <td>Ejecución de relación estatutaria — art. 6.1.b RGPD</td>
              </tr>
              <tr>
                <td>Cobro de cuotas y gestión de pagos</td>
                <td>Ejecución del contrato — art. 6.1.b RGPD</td>
              </tr>
              <tr>
                <td>Carnet digital y verificación de socio</td>
                <td>Ejecución del contrato — art. 6.1.b RGPD</td>
              </tr>
              <tr>
                <td>Comunicaciones sobre actividades del club (noticias, convocatorias)</td>
                <td>Interés legítimo del club — art. 6.1.f RGPD</td>
              </tr>
              <tr>
                <td>Respuesta a consultas del formulario de contacto</td>
                <td>Consentimiento del interesado — art. 6.1.a RGPD</td>
              </tr>
              <tr>
                <td>Solicitud y envío del carnet físico</td>
                <td>Consentimiento del interesado — art. 6.1.a RGPD</td>
              </tr>
              <tr>
                <td>Envío del boletín de noticias (newsletter)</td>
                <td>Consentimiento del interesado — art. 6.1.a RGPD</td>
              </tr>
              <tr>
                <td>Publicación de imagen en canales oficiales del club</td>
                <td>Consentimiento del interesado — art. 6.1.a RGPD</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Plazos de conservación</h2>
          <p>
            Los datos se conservan mientras dure la relación como socio. Una vez producida la baja, se
            mantendrán bloqueados durante los plazos legales aplicables:
          </p>
          <ul>
            <li><strong>Obligaciones fiscales y contables:</strong> 5 años (art. 66 LGT)</li>
            <li><strong>Reclamaciones civiles:</strong> 5 años (art. 1964 CC)</li>
            <li><strong>Formulario de contacto:</strong> 1 año desde la última comunicación</li>
          </ul>
          <p>Transcurridos dichos plazos, los datos serán suprimidos de forma segura.</p>

          <h2>5. Destinatarios y transferencias internacionales</h2>
          <p>
            El Club Deportivo Berriz utiliza los siguientes proveedores de servicios tecnológicos, con los
            que tiene suscritos contratos de encargado del tratamiento:
          </p>

          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Servicio</th>
                <th>Ubicación</th>
                <th>Garantías</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Supabase Inc.</td>
                <td>Base de datos de socios</td>
                <td>UE (Frankfurt)</td>
                <td>Servidores en la UE</td>
              </tr>
              <tr>
                <td>Stripe Inc.</td>
                <td>Procesamiento de pagos</td>
                <td>EE.UU.</td>
                <td>Cláusulas contractuales tipo (SCC)</td>
              </tr>
              <tr>
                <td>Resend Inc.</td>
                <td>Envío de correos transaccionales</td>
                <td>EE.UU.</td>
                <td>Cláusulas contractuales tipo (SCC)</td>
              </tr>
              <tr>
                <td>Vercel Inc.</td>
                <td>Alojamiento web</td>
                <td>EE.UU./UE</td>
                <td>Cláusulas contractuales tipo (SCC)</td>
              </tr>
              <tr>
                <td>Sanity AS</td>
                <td>Gestión de contenidos (CMS)</td>
                <td>Noruega/EE.UU.</td>
                <td>Acuerdo EEE y SCC</td>
              </tr>
            </tbody>
          </table>

          <p>No cedemos datos personales a terceros salvo obligación legal.</p>

          <h2>6. Derechos de las personas interesadas</h2>
          <p>
            En virtud del RGPD y la LOPDGDD, puedes ejercer los siguientes derechos dirigiéndote a{" "}
            <a href="mailto:infocdberriz@gmail.com">infocdberriz@gmail.com</a>:
          </p>
          <ul>
            <li><strong>Acceso:</strong> conocer qué datos tratamos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión («derecho al olvido»):</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
            <li><strong>Limitación:</strong> solicitar que suspendamos el tratamiento en determinados supuestos.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
          </ul>
          <p>
            Tienes también derecho a presentar una reclamación ante la Agencia Española de Protección de
            Datos (AEPD) en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
          </p>
          <p>Responderemos a tu solicitud en el plazo máximo de un mes desde su recepción.</p>

          <h2>7. Derechos de imagen</h2>
          <p>
            El C.D. Berriz puede publicar fotografías y vídeos en los que aparezcan socios, jugadores y
            asistentes a actos del club en sus canales oficiales (web, redes sociales, publicaciones
            impresas), siempre que el interesado haya prestado su consentimiento expreso.
          </p>
          <p>
            En el caso de <strong>menores de edad</strong>, el consentimiento debe ser otorgado por sus
            padres o tutores legales, de conformidad con la Ley Orgánica 1/1996 de Protección Jurídica del
            Menor y el art. 8 del RGPD.
          </p>
          <p>
            El consentimiento puede retirarse en cualquier momento comunicándolo a{" "}
            <a href="mailto:infocdberriz@gmail.com">infocdberriz@gmail.com</a>. La retirada no afectará
            a la licitud de los usos realizados con anterioridad.
          </p>

          <h2>8. Seguridad</h2>
          <p>
            El Club Deportivo Berriz aplica medidas técnicas y organizativas adecuadas para proteger los
            datos personales frente al acceso no autorizado, pérdida o alteración, incluyendo:
          </p>
          <ul>
            <li>Cifrado de la comunicación mediante HTTPS/TLS.</li>
            <li>Control de acceso basado en roles (solo el personal autorizado accede a los datos de socios).</li>
            <li>Autenticación segura para el portal de socios y el panel de administración.</li>
            <li>Copias de seguridad periódicas de la base de datos.</li>
          </ul>

          <h2>9. Modificaciones</h2>
          <p>
            El club se reserva el derecho a actualizar esta Política de Privacidad para adaptarla a cambios
            normativos o de servicio. Notificaremos los cambios significativos a los socios por correo
            electrónico. La versión vigente estará siempre disponible en esta página.
          </p>
        </div>
      </div>
    </>
  );
}
