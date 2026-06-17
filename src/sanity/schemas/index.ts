import { localeString } from "./objects/localeString";
import { localeText } from "./objects/localeText";
import { localeBlockContent } from "./objects/localeBlockContent";
import { noticia } from "./documents/noticia";
import { equipo } from "./documents/equipo";
import { jugador } from "./documents/jugador";
import { documentoDescargable } from "./documents/documentoDescargable";
import { socioTipoAbono } from "./documents/socioTipoAbono";
import { evento } from "./documents/evento";
import { paginaInicio } from "./documents/paginaInicio";
import { juntaDirectiva } from "./documents/juntaDirectiva";

export const schemaTypes = [
  // Objetos reutilizables (traducción es/eu)
  localeString,
  localeText,
  localeBlockContent,
  // Documentos
  noticia,
  evento,
  equipo,
  jugador,
  socioTipoAbono,
  documentoDescargable,
  paginaInicio,
  juntaDirectiva,
];
