import { defineType, defineField } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export const evento = defineType({
  name: "evento",
  title: "Evento",
  type: "document",
  icon: CalendarIcon,
  fields: [
    defineField({
      name: "titulo",
      title: "Título",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "fecha",
      title: "Fecha y hora",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tipo",
      title: "Tipo de evento",
      description:
        "Marca el color con el que sale en la web: granate para los partidos, azul para los actos del club.",
      type: "string",
      options: {
        list: [
          { title: "Partido", value: "partido" },
          { title: "Acto del club", value: "club" },
        ],
        layout: "radio",
      },
      initialValue: "partido",
      validation: (r) => r.required(),
    }),
    defineField({ name: "lugar", title: "Lugar", type: "string" }),
    defineField({ name: "descripcion", title: "Descripción", type: "localeText" }),
  ],
  orderings: [
    { title: "Fecha", name: "fechaAsc", by: [{ field: "fecha", direction: "asc" }] },
  ],
  preview: { select: { title: "titulo.es", subtitle: "fecha", tipo: "tipo" } },
});
