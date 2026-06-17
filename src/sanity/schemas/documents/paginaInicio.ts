import { defineType, defineField } from "sanity";
import { HomeIcon } from "@sanity/icons";

// Documento único (singleton) con el contenido editable de la portada.
export const paginaInicio = defineType({
  name: "paginaInicio",
  title: "Página de inicio",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({ name: "heroTitulo", title: "Título del hero", type: "localeString" }),
    defineField({
      name: "heroSubtitulo",
      title: "Subtítulo / lema",
      type: "localeString",
    }),
    defineField({
      name: "heroImagen",
      title: "Imagen del hero (el campo)",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: { prepare: () => ({ title: "Página de inicio" }) },
});
