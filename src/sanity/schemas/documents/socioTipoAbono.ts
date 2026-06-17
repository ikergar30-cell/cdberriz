import { defineType, defineField, defineArrayMember } from "sanity";
import { TagIcon } from "@sanity/icons";

export const socioTipoAbono = defineType({
  name: "socioTipoAbono",
  title: "Tipo de abono (socios/as)",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "nombre",
      title: "Nombre",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "precio",
      title: "Precio (€/año)",
      type: "number",
      validation: (r) => r.required().min(0),
    }),
    defineField({ name: "descripcion", title: "Descripción", type: "localeText" }),
    defineField({
      name: "beneficios",
      title: "Beneficios",
      type: "array",
      of: [defineArrayMember({ type: "localeString" })],
    }),
    defineField({ name: "orden", title: "Orden", type: "number", initialValue: 0 }),
    defineField({
      name: "destacado",
      title: "Destacado",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    { title: "Orden", name: "ordenAsc", by: [{ field: "orden", direction: "asc" }] },
  ],
  preview: {
    select: { title: "nombre.es", subtitle: "precio" },
    prepare({ title, subtitle }) {
      return { title, subtitle: subtitle != null ? `${subtitle} €/año` : "" };
    },
  },
});
