import type { StructureResolver } from "sanity/structure";

// Organización del panel de Sanity. "Página de inicio" y "Junta Directiva"
// son documentos únicos (singletons): se editan como un único elemento.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Contenido")
    .items([
      S.listItem()
        .title("Página de inicio")
        .id("paginaInicio")
        .child(
          S.document().schemaType("paginaInicio").documentId("paginaInicio"),
        ),
      S.listItem()
        .title("Junta Directiva")
        .id("juntaDirectiva")
        .child(
          S.document()
            .schemaType("juntaDirectiva")
            .documentId("juntaDirectiva"),
        ),
      S.divider(),
      S.documentTypeListItem("noticia").title("Noticias"),
      S.documentTypeListItem("evento").title("Eventos"),
      S.documentTypeListItem("equipo").title("Equipos"),
      S.documentTypeListItem("jugador").title("Jugadores/as"),
      S.documentTypeListItem("socioTipoAbono").title("Tipos de abono"),
      S.documentTypeListItem("documentoDescargable").title("Documentos"),
    ]);
