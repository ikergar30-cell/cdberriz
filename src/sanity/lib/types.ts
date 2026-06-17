import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export type LocaleString = { es?: string; eu?: string };
export type LocaleText = LocaleString;

export type Noticia = {
  _id: string;
  titulo: LocaleString;
  slug: string;
  categoria: string;
  fecha: string;
  extracto?: LocaleText;
  portada?: SanityImageSource & { alt?: string };
  portadaDims?: { width: number; height: number; aspectRatio: number };
  cuerpo?: { es?: unknown[]; eu?: unknown[] };
};

export type Evento = {
  _id: string;
  titulo: LocaleString;
  fecha: string;
  lugar?: string;
  descripcion?: LocaleText;
};

export type Equipo = {
  _id: string;
  nombre: LocaleString;
  slug: string;
  grupo: "federado" | "escolar" | "baloncesto";
  categoria: string;
  temporada?: string;
  foto?: SanityImageSource;
  descripcion?: LocaleText;
};

export type SocioTipoAbono = {
  _id: string;
  nombre: LocaleString;
  precio: number;
  descripcion?: LocaleText;
  beneficios?: LocaleString[];
  destacado?: boolean;
};

export type MiembroJunta = {
  nombre: string;
  cargo?: LocaleString;
  foto?: SanityImageSource;
};

export type DocumentoDescargable = {
  _id: string;
  titulo: LocaleString;
  categoria: string;
  descripcion?: LocaleText;
  fecha?: string;
  url?: string;
};

export type PaginaInicio = {
  heroTitulo?: LocaleString;
  heroSubtitulo?: LocaleString;
  heroImagen?: SanityImageSource;
};

export type Sponsor = {
  _id: string;
  nombre: string;
  url?: string;
  nivel?: "principal" | "colaborador" | "otro";
  logo?: SanityImageSource;
};
