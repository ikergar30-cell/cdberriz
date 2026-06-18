import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AvisoLegalPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  return (
    <>
      <PageHeader
        title={eu ? "Lege-oharra" : "Aviso Legal"}
        intro={eu ? "cdberriz.com webgunearen erabilera-baldintzak" : "Condiciones de uso del sitio web cdberriz.com"}
      />
      <div className="container max-w-3xl py-12 md:py-16">
        {eu && (
          <div className="mb-8 rounded-xl border border-azul-200 bg-azul-50 p-5 text-sm text-azul-700">
            Dokumentu hau gaztelaniaz bakarrik dago eskuragarri, arrazoi juridikoengatik.
          </div>
        )}
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-azul-800 prose-a:text-azul prose-a:no-underline hover:prose-a:underline">
          <p className="text-sm text-neutral-500">Última actualización: junio de 2026</p>

          <h2>1. Datos identificativos del titular</h2>
          <p>
            En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la
            Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los
            datos identificativos del titular de este sitio web:
          </p>
          <ul>
            <li><strong>Denominación social:</strong> Club Deportivo Berriz</li>
            <li><strong>CIF:</strong> G48309108</li>
            <li><strong>Domicilio social:</strong> Calle Legaño 6, 48240 Berriz, Bizkaia</li>
            <li><strong>Correo electrónico:</strong> <a href="mailto:infocdberriz@gmail.com">infocdberriz@gmail.com</a></li>
            <li><strong>Teléfono:</strong> 692 076 167</li>
            <li><strong>Sitio web:</strong> www.cdberriz.com</li>
          </ul>

          <h2>2. Objeto y ámbito de aplicación</h2>
          <p>
            El presente Aviso Legal regula el acceso y uso del sitio web <strong>www.cdberriz.com</strong> (en
            adelante, «el Sitio»), titularidad del Club Deportivo Berriz. El acceso y la navegación por el
            Sitio implica la aceptación expresa de las condiciones recogidas en este documento. Si no está de
            acuerdo con ellas, le rogamos que no utilice el Sitio.
          </p>

          <h2>3. Condiciones de uso</h2>
          <p>
            El usuario se compromete a hacer un uso lícito del Sitio, conforme a la legislación vigente, la
            buena fe y el orden público. Queda expresamente prohibido:
          </p>
          <ul>
            <li>Reproducir, distribuir o modificar los contenidos sin autorización expresa.</li>
            <li>Utilizar el Sitio con fines comerciales no autorizados por el club.</li>
            <li>Introducir virus o código malicioso que puedan dañar los sistemas informáticos.</li>
            <li>Suplantar la identidad de terceros o del propio club.</li>
            <li>Acceder de forma no autorizada a áreas restringidas del Sitio.</li>
          </ul>

          <h2>4. Propiedad intelectual e industrial</h2>
          <p>
            Todos los contenidos del Sitio —incluyendo, sin limitación, textos, fotografías, gráficos,
            logotipos, iconos, escudos, diseño y código fuente— son propiedad del Club Deportivo Berriz o de
            terceros que han autorizado su uso, y están protegidos por la legislación española e internacional
            sobre propiedad intelectual e industrial.
          </p>
          <p>
            Queda prohibida su reproducción total o parcial, distribución, comunicación pública o
            transformación sin autorización escrita del club, salvo en los supuestos legalmente permitidos.
          </p>

          <h2>5. Exclusión de responsabilidad</h2>
          <p>
            El Club Deportivo Berriz no garantiza la disponibilidad ininterrumpida del Sitio ni que esté
            libre de errores. No se hace responsable de los daños derivados de interrupciones técnicas,
            fallos de conexión o accesos no autorizados por parte de terceros.
          </p>
          <p>
            El Sitio puede contener enlaces a páginas web de terceros. El club no controla esos sitios ni se
            responsabiliza de sus contenidos o políticas de privacidad. Los enlaces se proporcionan
            únicamente como referencia.
          </p>

          <h2>6. Protección de datos</h2>
          <p>
            El tratamiento de datos personales que se realice a través del Sitio se rige por la{" "}
            <a href="/legal/privacidad">Política de Privacidad</a> del Club Deportivo Berriz, de conformidad
            con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
          </p>

          <h2>7. Cookies</h2>
          <p>
            El Sitio utiliza cookies técnicas necesarias para su funcionamiento. Puede obtener más información
            en nuestra <a href="/legal/cookies">Política de Cookies</a>.
          </p>

          <h2>8. Legislación aplicable y jurisdicción</h2>
          <p>
            El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier
            controversia derivada del acceso o uso del Sitio, las partes se someten, con renuncia expresa a
            cualquier otro fuero, a los Juzgados y Tribunales de Bilbao (Bizkaia).
          </p>

          <h2>9. Modificaciones</h2>
          <p>
            El Club Deportivo Berriz se reserva el derecho de modificar el presente Aviso Legal en cualquier
            momento. Las modificaciones entrarán en vigor desde su publicación en el Sitio. Se recomienda
            revisarlo periódicamente.
          </p>
        </div>
      </div>
    </>
  );
}
