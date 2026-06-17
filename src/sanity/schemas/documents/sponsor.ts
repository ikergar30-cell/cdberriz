import { defineType, defineField } from "sanity";
import { StarIcon } from "@sanity/icons";

// Patrocinador / colaborador del club. Pensado para añadirlos fácilmente desde
// el Studio en el futuro: nombre, logo, enlace y nivel.
export const sponsor = defineType({
  name: "sponsor",
  title: "Patrocinador",
  type: "document",
  icon: StarIcon,
  fields: [
    defineField({
      name: "nombre",
      title: "Nombre",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "url",
      title: "Enlace (web del patrocinador)",
      type: "url",
    }),
    defineField({
      name: "nivel",
      title: "Nivel",
      type: "string",
      options: {
        list: [
          { title: "Principal", value: "principal" },
          { title: "Colaborador", value: "colaborador" },
          { title: "Otro", value: "otro" },
        ],
        layout: "radio",
      },
      initialValue: "colaborador",
    }),
    defineField({ name: "orden", title: "Orden", type: "number", initialValue: 0 }),
    defineField({
      name: "activo",
      title: "Activo (visible en la web)",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    { title: "Orden", name: "ordenAsc", by: [{ field: "orden", direction: "asc" }] },
  ],
  preview: {
    select: { title: "nombre", subtitle: "nivel", media: "logo" },
  },
});
