import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function CondicionesSociosPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const eu = locale === "eu";

  return (
    <>
      <PageHeader
        title={eu ? "Bazkideen baldintzak" : "Condiciones de socios/as"}
        intro={
          eu
            ? "Kuota, berritzea, baja eta irudiaren erabilerari buruzko baldintzak"
            : "Condiciones sobre la cuota, su renovación, la baja y el uso de tu imagen"
        }
      />
      <div className="container max-w-3xl py-12 md:py-16">
        {eu && (
          <div className="mb-8 rounded-xl border border-azul-200 bg-azul-50 p-5 text-sm text-azul-700">
            Dokumentu hau gaztelaniaz bakarrik dago eskuragarri, arrazoi juridikoengatik.
          </div>
        )}
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-azul-800 prose-a:text-azul prose-a:no-underline hover:prose-a:underline">
          <p className="text-sm text-neutral-500">Última actualización: agosto de 2026</p>

          <h2>1. La cuota y su renovación</h2>
          <p>
            Todas las cuotas de socio/a se sincronizan a un único ciclo anual que se renueva
            el <strong>1 de julio</strong>, sin importar en qué mes te hayas hecho socio/a. El
            primer pago (el del alta) es siempre el precio completo de la cuota que corresponda;
            nunca se prorratea a la baja.
          </p>
          <p>
            Si te haces socio/a en un momento del año en que a la siguiente renovación del 1 de
            julio le quedaría menos de 45 días, tu primer cobro ya cubre esa temporada y el
            siguiente cobro pasa directamente al 1 de julio del año <em>siguiente</em>. Por
            ejemplo: si te haces socio/a en junio de un año, tu próximo cobro no es el 1 de julio
            de ese mismo año (apenas quedarían unos días), sino el 1 de julio del año siguiente.
          </p>

          <h2>2. Derecho de desistimiento (14 días)</h2>
          <p>
            Como en cualquier contrato a distancia, dispones de <strong>14 días naturales</strong>{" "}
            desde el pago de tu cuota para desistir y solicitar la devolución completa, siempre y
            cuando <strong>no hayas empezado a usar el servicio</strong> — es decir, que no hayas
            entrado todavía al campo con tu carné de socio/a. Cada entrada válida queda registrada
            en nuestro control de acceso.
          </p>
          <p>
            Si ya has usado el carné, el desistimiento dentro del plazo de 14 días no aplica: en
            ese caso puedes cancelar la renovación cuando quieras, y seguirás siendo socio/a
            activo/a hasta el final del periodo que ya has pagado, sin que se te cobre de nuevo.
          </p>
          <p>
            Puedes ejercer este derecho desde tu propio portal de socio/a (apartado &quot;Cancelar
            mi cuota&quot;) o escribiéndonos a{" "}
            <a href="mailto:infocdberriz@gmail.com">infocdberriz@gmail.com</a>.
          </p>

          <h2>3. Reclamaciones y disputas bancarias</h2>
          <p>
            Si en vez de cancelar por los medios anteriores abres una reclamación o disputa
            (&quot;chargeback&quot;) directamente en tu banco o a través de la pasarela de pago,
            ten en cuenta que esa gestión tiene un coste real para el club: <strong>20 €</strong>{" "}
            solo por la apertura de la disputa, y <strong>otros 20 €</strong> adicionales si el
            club decide responderla. Si el club gana la disputa, esos gastos (hasta 40 €) se te
            repercutirán a ti, por haberla abierto de forma injustificada pudiendo haber
            cancelado por las vías normales descritas en el punto 2.
          </p>

          <h2>4. Autorización de imagen</h2>
          <p>
            Al hacerte socio/a autorizas al C.D. Berriz a utilizar tu imagen (o la de la persona
            menor de edad de la que eres madre, padre o tutor/a legal) en fotografías y vídeos
            tomados en actividades del club y publicados en sus canales oficiales (web, redes
            sociales, publicaciones), conforme a la Ley Orgánica 1/1996 cuando corresponda. Puedes
            revocar esta autorización en cualquier momento escribiendo a{" "}
            <a href="mailto:infocdberriz@gmail.com">infocdberriz@gmail.com</a>, sin que ello
            afecte a tu condición de socio/a.
          </p>

          <h2>5. Aceptación</h2>
          <p>
            Al completar el alta como socio/a, declaras haber leído y aceptado estas condiciones,
            así como la{" "}
            <a href={`/${locale}/legal/privacidad`}>Política de Privacidad</a>.
          </p>
        </div>
      </div>
    </>
  );
}
