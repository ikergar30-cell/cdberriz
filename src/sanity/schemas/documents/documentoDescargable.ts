import { defineType, defineField } from "sanity";
import { DownloadIcon } from "@sanity/icons";

export const documentoDescargable = defineType({
  name: "documentoDescargable",
  title: "Documento descargable",
  type: "document",
  icon: DownloadIcon,
  fields: [
    defineField({
      name: "titulo",
      title: "Título",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "categoria",
      title: "Categoría",
      type: "string",
      options: {
        list: [
          { title: "Familias", value: "familias" },
          { title: "Club", value: "club" },
          { title: "Socios/as", value: "socios" },
          { title: "Otros", value: "otros" },
        ],
      },
      initialValue: "familias",
    }),
    defineField({
      name: "archivo",
      title: "Archivo",
      type: "file",
      validation: (r) => r.required(),
    }),
    defineField({ name: "descripcion", title: "Descripción", type: "localeText" }),
    defineField({ name: "fecha", title: "Fecha", type: "date" }),
  ],
  preview: { select: { title: "titulo.es", subtitle: "categoria" } },
});
