import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export const noticia = defineType({
  name: "noticia",
  title: "Noticia",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "titulo",
      title: "Título",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "titulo.es", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "categoria",
      title: "Categoría",
      type: "string",
      options: {
        list: [
          { title: "Cantera", value: "cantera" },
          { title: "Club", value: "club" },
          { title: "Primer equipo", value: "primer-equipo" },
          { title: "Socios/as", value: "socios" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "fecha",
      title: "Fecha",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: "portada",
      title: "Imagen de portada",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
      ],
    }),
    defineField({ name: "extracto", title: "Extracto", type: "localeText" }),
    defineField({ name: "cuerpo", title: "Cuerpo", type: "localeBlockContent" }),
    defineField({
      name: "destacada",
      title: "Destacada en portada",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Fecha (más reciente)",
      name: "fechaDesc",
      by: [{ field: "fecha", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "titulo.es", subtitle: "categoria", media: "portada" },
  },
});
