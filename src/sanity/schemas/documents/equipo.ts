import { defineType, defineField, defineArrayMember } from "sanity";
import { UsersIcon } from "@sanity/icons";

export const equipo = defineType({
  name: "equipo",
  title: "Equipo",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({
      name: "nombre",
      title: "Nombre",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "nombre.es", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "grupo",
      title: "Grupo",
      type: "string",
      options: {
        list: [
          { title: "Fútbol Federado", value: "federado" },
          { title: "Fútbol Escolar", value: "escolar" },
          { title: "Baloncesto", value: "baloncesto" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "categoria",
      title: "Categoría",
      type: "string",
      options: {
        list: [
          { title: "Regional", value: "regional" },
          { title: "Juvenil", value: "juvenil" },
          { title: "Cadete", value: "cadete" },
          { title: "Veteranos", value: "veteranos" },
          { title: "Infantil", value: "infantil" },
          { title: "Alevín", value: "alevin" },
          { title: "Benjamín", value: "benjamin" },
          { title: "Fut. Eskola", value: "fut-eskola" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "temporada",
      title: "Temporada",
      type: "string",
      description: "Ej.: 2024/2025",
    }),
    defineField({ name: "orden", title: "Orden", type: "number", initialValue: 0 }),
    defineField({
      name: "foto",
      title: "Foto del equipo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "descripcion", title: "Descripción", type: "localeText" }),
    defineField({
      name: "entrenadores",
      title: "Cuerpo técnico",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      description: "Nombres del cuerpo técnico (personas adultas).",
    }),
    defineField({
      name: "jugadores",
      title: "Jugadores/as",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "jugador" }] })],
      description:
        "⚠️ DATOS DE MENORES. Campo oculto por defecto. Publicar solo con consentimiento de imagen/datos verificado (RGPD).",
      hidden: true,
    }),
  ],
  orderings: [
    { title: "Orden", name: "ordenAsc", by: [{ field: "orden", direction: "asc" }] },
  ],
  preview: {
    select: { title: "nombre.es", subtitle: "categoria", media: "foto" },
  },
});
