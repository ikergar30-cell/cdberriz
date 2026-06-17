import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function HistoriaPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("club");
  const eu = locale === "eu";
  // Atajo para textos bilingües.
  const tx = (es: string, e: string) => (eu ? e : es);

  const h2 =
    "font-display text-2xl font-extrabold uppercase tracking-tight text-azul-700 md:text-3xl";
  const p = "text-lg leading-relaxed text-neutral-700";

  return (
    <>
      <PageHeader
        title={t("historiaTitle")}
        intro={tx(
          "Más de 50 años fomentando el deporte y construyendo comunidad en Berriz.",
          "50 urte baino gehiago Berrizen kirola sustatzen eta komunitatea eraikitzen.",
        )}
      />

      <article className="container max-w-3xl space-y-12 py-12 md:py-16">
        {/* Foto de cabecera */}
        <figure>
          <Image
            src="/historia/accion-bn.jpg"
            alt={tx("Partido en Berrizburu", "Partida bat Berrizburun")}
            width={1400}
            height={961}
            className="w-full rounded-2xl object-cover"
            priority
          />
          <figcaption className="mt-2 text-center text-sm text-neutral-500">
            {tx("Un partido en Berrizburu.", "Partida bat Berrizburun.")}
          </figcaption>
        </figure>

        {/* 1. Orígenes */}
        <section className="space-y-5">
          <h2 className={h2}>{tx("Los orígenes", "Hastapenak")}</h2>
          <p className={p}>
            {tx(
              "Aunque el Club Deportivo Berriz se fundó oficialmente en 1973, la afición al fútbol y al deporte en la localidad se remonta mucho más atrás. Ya a mediados del siglo XX se organizaban partidos entre los distintos barrios de Berriz, que alimentaban una rivalidad amistosa entre vecinos.",
              "Berriz Kirol Kluba 1973an sortu zen ofizialki, baina futbolarekiko eta kirolarekiko zaletasuna askoz lehenagokoa da herrian. XX. mendearen erdialdean jada Berrizko auzoen arteko partidak antolatzen ziren, eta horrek auzokideen arteko lehia adiskidetsua elikatzen zuen.",
            )}
          </p>
          <p className={p}>
            {tx(
              "Durante los años 50 comenzaron a disputarse encuentros contra equipos de localidades cercanas como Arriandi, Orobio, Ermua, Zaldibar o Eibar, y se participó en diversos torneos, como los de Ermua. Uno de aquellos partidos quedó registrado oficialmente con esta alineación: Roberto Unzueta; los hermanos Rafa, Luis Mari y José Ignacio Ibarra; Santiago Sasieta, José Ignacio Alberdi, Ricardo Albizuri, Miguel Alberdi, José Mari Maiztegui, Javi Berasaluce, Luis Gorroño, Ernesto Arrizabalaga, José Ignacio Bravo, Carmelo Aranguren y Leonardo Iriarte.",
              "50eko hamarkadan, inguruko herrietako taldeen aurkako partidak jokatzen hasi ziren —Arriandi, Orobio, Ermua, Zaldibar edo Eibar—, eta hainbat txapelketatan parte hartu zuten, Ermuakoetan adibidez. Partida horietako bat ofizialki erregistratu zen, honako hamaikako honekin: Roberto Unzueta; Rafa, Luis Mari eta José Ignacio Ibarra anaiak; Santiago Sasieta, José Ignacio Alberdi, Ricardo Albizuri, Miguel Alberdi, José Mari Maiztegui, Javi Berasaluce, Luis Gorroño, Ernesto Arrizabalaga, José Ignacio Bravo, Carmelo Aranguren eta Leonardo Iriarte.",
            )}
          </p>
          <p className={p}>
            {tx(
              "En los años 60, los torneos se hicieron habituales en municipios como Elorrio, Lauaxeta o los Jesuitas de Durango. Más allá de las competiciones oficiales, figuras como Naranjo el barbero y Eufemiano Martín organizaban partidos informales en la campa junto a la Marquesa, mientras que Rodolfo, Galo y otros jugaban en la campa de la fundición, apostándose a menudo una ronda o una cena. Ellos fueron los auténticos precursores del fútbol en Berriz.",
              "60ko hamarkadan, txapelketak ohikoak bihurtu ziren beste herri batzuetan ere, hala nola Elorrio, Lauaxeta edo Durangoko Jesuitetan. Lehiaketa ofizialez gain, Naranjo bizarginak eta Eufemiano Martínek partida informalak antolatzen zituzten Markesaren ondoko zelaian, eta Rodolfo, Galo eta beste batzuek galdategiko zelaian jokatzen zuten, askotan txikiteo bat edo afari bat jokoan jarrita. Haiek izan ziren Berrizko futbolaren benetako aitzindariak.",
            )}
          </p>
        </section>

        {/* 2. Fundación */}
        <section className="space-y-5">
          <h2 className={h2}>{tx("La fundación (1973)", "Sorrera (1973)")}</h2>
          <p className={p}>
            {tx(
              "El 12 de julio de 1973, en el bar Urtiaga de Berriz —primera sede del club— se celebró la reunión fundacional del Club Deportivo Berriz. Bajo la presidencia de Eduardo Urcelay Asteguia y con Fernando Arana Aguirresacona como secretario, se constituyó la primera junta provisional.",
              "1973ko uztailaren 12an, Berrizko Urtiaga tabernan —klubaren lehen egoitza—, Berriz Kirol Klubaren sorrera-bilera egin zen. Eduardo Urcelay Asteguia presidente eta Fernando Arana Aguirresacona idazkari zirela, klubaren behin-behineko lehen zuzendaritza eratu zen.",
            )}
          </p>

          {/* Primera junta directiva */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-rojo">
              {tx("Primera junta directiva", "Lehen zuzendaritza-batzordea")}
            </h3>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {[
                [tx("Presidente", "Presidentea"), "Eduardo Urcelay Asteguia"],
                [tx("Vicepresidente", "Presidenteordea"), "Víctor Oguiza"],
                [tx("Secretario", "Idazkaria"), "Fernando Arana"],
                [tx("Tesorero", "Diruzaina"), "Ernesto Arrizabalaga"],
              ].map(([rol, nombre]) => (
                <div key={rol} className="flex justify-between gap-3 border-b border-neutral-200 py-1">
                  <dt className="font-semibold text-neutral-600">{rol}</dt>
                  <dd className="text-right text-neutral-800">{nombre}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-neutral-600">
              <span className="font-semibold">{tx("Vocales: ", "Batzordekideak: ")}</span>
              Rodolfo Urcelay, Javier Urrejola, Javier Berasaluce, Diego Camacho, José Ignacio
              Etxebarria, Félix Loizate, Ángel Vigueras {tx("y", "eta")} Enrique Magdalena.
            </p>
          </div>

          <p className={p}>
            {tx(
              "En la misma reunión se ratificó el objetivo principal del club: fomentar el deporte en Berriz, empezando por el fútbol pero con la vocación de incluir otras disciplinas. Gracias a la generosidad de la Cultural de Durango, durante aquella primera temporada se pudo usar su campo como local. El primer equipo —dirigido por Filiberto Azcárate, exjugador del Real Madrid— lo formaron jugadores como Jesús Gorroño, Toto Iribar, Quero, Alonso, Tati, Fernan Azcárate, Blasco Zumárraga, Torrado, Zamora, Marianín, Aguirre o Berecibar.",
              "Bilera berean klubaren helburu nagusia berretsi zen: Berrizen kirola sustatzea, futboletik hasita baina beste diziplina batzuk ere barne hartzeko asmoz. Durangoko Kulturalaren eskuzabaltasunari esker, lehen denboraldi hartan haien zelaia erabili ahal izan zen. Lehen taldea —Filiberto Azcáratek, Real Madrilen jokalari ohiak, zuzendua— honako jokalariek osatu zuten: Jesús Gorroño, Toto Iribar, Quero, Alonso, Tati, Fernan Azcárate, Blasco Zumárraga, Torrado, Zamora, Marianín, Aguirre edo Berecibar.",
            )}
          </p>
        </section>

        {/* Foto entrega de placas */}
        <figure>
          <Image
            src="/historia/entrega-placas-80s.jpg"
            alt={tx("Acto del club en los años 80", "Klubaren ekitaldia 80ko hamarkadan")}
            width={1400}
            height={1034}
            className="w-full rounded-2xl object-cover"
          />
          <figcaption className="mt-2 text-center text-sm text-neutral-500">
            {tx("Un acto del club en los años 80.", "Klubaren ekitaldi bat, 80ko hamarkadan.")}
          </figcaption>
        </figure>

        {/* 3. Berrizburu */}
        <section className="space-y-5">
          <h2 className={h2}>{tx("El campo de Berrizburu", "Berrizburu zelaia")}</h2>
          <p className={p}>
            {tx(
              "En abril de 1973, antes incluso de constituirse formalmente el club, Rodolfo Urcelay ya había solicitado al Ayuntamiento un terreno para construir un campo de fútbol. Las obras concluyeron en 1974 y, en junio, se entregaron las llaves. El 31 de agosto de ese año se inauguró oficialmente el campo de Berrizburu con un partido entre el Bilbao Athletic y el Eibar.",
              "1973ko apirilean, kluba ofizialki eratu baino lehen, Rodolfo Urcelayk Udalari lursail bat eskatua zion futbol-zelai bat eraikitzeko. Obrak 1974an amaitu ziren eta, ekainean, giltzak eman ziren. Urte hartako abuztuaren 31n Berrizburu zelaia ofizialki inauguratu zen, Bilbao Athletic eta Eibarren arteko partida batekin.",
            )}
          </p>
          <p className={p}>
            {tx(
              "El campo se construyó en terrenos municipales, aunque con carencias como la falta de luz, agua y vestuarios adecuados. Estas deficiencias provocaron varios conflictos entre el club, el Ayuntamiento y la federación, ya que no estaban claras ni la titularidad ni la responsabilidad de su mantenimiento.",
              "Zelaia udal-lursailetan eraiki zen, baina gabeziekin: argirik, urik eta aldagela egokirik gabe. Gabezia horiek hainbat liskar eragin zituzten klubaren, Udalaren eta federazioaren artean, ez baitzegoen argi zelaiaren titulartasuna ezta mantentze-lanen ardura ere.",
            )}
          </p>
          <p className={p}>
            {tx(
              "La situación se agravó en 1975, durante las fiestas de San Pedro y Santa Isabel, cuando el campo se utilizó para una suelta de vaquillas. La federación reaccionó clausurándolo hasta su desinfección, lo que provocó un gran revuelo a nivel nacional. Como consecuencia, la junta directiva dimitió en bloque y, ante la falta de consenso para formar una nueva, se designaron tres miembros temporales para reorganizar el club.",
              "Egoera 1975ean larriagotu zen, San Pedro eta Santa Isabel jaietan, zelaia bigantxen aske-uzte baterako erabili zenean. Federazioak itxi egin zuen desinfektatu arte, eta horrek iskanbila handia sortu zuen estatu mailan. Ondorioz, zuzendaritzak osorik dimisioa eman zuen eta, berri bat osatzeko adostasunik lortu ez zenez, hiru kide behin-behineko izendatu ziren kluba berrantolatzeko.",
            )}
          </p>
          <p className={p}>
            {tx(
              "A pesar de las dificultades, el trabajo desinteresado de muchas personas —como Eufemiano, Pineda o Toñín— permitió que el club siguiera adelante. Entre los hitos posteriores del campo destacan la construcción de la tribuna en 1992 y la instalación del césped artificial en 1997.",
              "Zailtasunak gorabehera, pertsona askoren lan eskuzabalari esker —Eufemiano, Pineda edo Toñín, besteak beste— klubak aurrera jarraitu zuen. Zelaiaren geroko mugarrien artean, 1992an tribuna eraiki zen eta 1997an belar artifiziala jarri zen.",
            )}
          </p>
        </section>

        {/* Foto recorte de prensa */}
        <figure>
          <div className="flex justify-center rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <Image
              src="/historia/recorte-filial.jpg"
              alt={tx("El Berriz en la prensa", "Berriz prentsan")}
              width={1209}
              height={1400}
              className="max-h-[560px] w-auto rounded-lg object-contain"
            />
          </div>
          <figcaption className="mt-2 text-center text-sm text-neutral-500">
            {tx("El Berriz, en la prensa.", "Berriz, prentsan.")}
          </figcaption>
        </figure>

        {/* 4. Un club, una familia */}
        <section className="space-y-5">
          <h2 className={h2}>{tx("Un club, una familia", "Klub bat, familia bat")}</h2>
          <p className={p}>
            {tx(
              "Con el paso de los años, el Club Deportivo Berriz ha seguido creciendo, tanto en número de socios como en equipos de distintas categorías, integrando además otras disciplinas como el baloncesto. Ya en la temporada 1974-75 la junta la formaban 12 directivos y el club contaba con 550 socios; en pocos años disponía de dos equipos de mayores, dos juveniles, un equipo femenino, uno cadete, uno infantil y un equipo femenino de baloncesto, con más de 150 jugadoras y jugadores.",
              "Urteak igaro ahala, Berriz Kirol Kluba hazten joan da, bai bazkide kopuruan bai kategoria askotako taldeetan, eta beste diziplina batzuk ere barne hartu ditu, hala nola saskibaloia. 1974-75 denboraldian zuzendaritza 12 kidek osatzen zuten eta klubak 550 bazkide zituen; urte gutxian, bi nagusi-talde, bi gazte-talde, emakumezko talde bat, kadete bat, infantil bat eta emakumezko saskibaloi-talde bat zituen, 150 jokalari baino gehiagorekin.",
            )}
          </p>
          <p className={p}>
            {tx(
              "Este crecimiento fue posible gracias al esfuerzo de muchísimas personas: presidentes, directivos, delegados, entrenadores, madres, padres, jugadoras y jugadores, Ayuntamiento y federación. Algunos nombres quedarán siempre en la memoria del club, como Serafín Cedrún, entrenador del primer equipo durante quince temporadas consecutivas (1981-1996); Rafa Cabrerizo, masajista del primer equipo durante catorce años; o Esteban Ramos, delegado durante dieciséis años y, más tarde, presidente.",
              "Hazkunde hori pertsona askoren ahaleginari esker izan zen posible: presidenteak, zuzendariak, ordezkariak, entrenatzaileak, amak, aitak, jokalariak, Udala eta federazioa. Izen batzuk betiko geratuko dira klubaren oroimenean, hala nola Serafín Cedrún, lehen taldearen entrenatzailea hamabost denboraldi jarraian (1981-1996); Rafa Cabrerizo, lehen taldearen masajista hamalau urtez; edo Esteban Ramos, hamasei urtez ordezkari eta, geroago, presidente.",
            )}
          </p>
          <p className={p}>
            {tx(
              "Han pasado más de cincuenta años desde la fundación, con incontables recuerdos, finales, ascensos y descensos. Pero lo que nunca ha cambiado es la esencia del C.D. Berriz: un club nacido para fomentar el deporte, crear comunidad y crecer como una gran familia.",
              "Berrogeita hamar urte baino gehiago igaro dira sorreratik, kontaezinak diren oroitzapen, final, igoera eta jaitsierekin. Baina inoiz aldatu ez dena Berriz Kirol Klubaren funtsa da: kirola sustatzeko, komunitatea sortzeko eta familia handi bat bezala hazteko jaiotako kluba.",
            )}
          </p>
        </section>

        {/* Lema */}
        <p className="border-t border-neutral-200 pt-8 text-center font-display text-xl font-extrabold uppercase text-rojo">
          50 urte ilusioak elkarbanatuz
        </p>
      </article>
    </>
  );
}
