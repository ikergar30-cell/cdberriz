import { defineType, defineField, defineArrayMember } from "sanity";
import { CaseIcon } from "@sanity/icons";

// Documento único (singleton) con los miembros de la Junta Directiva.
export const juntaDirectiva = defineType({
  name: "juntaDirectiva",
  title: "Junta Directiva",
  type: "document",
  icon: CaseIcon,
  fields: [
    defineField({
      name: "miembros",
      title: "Miembros",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "miembro",
          fields: [
            defineField({
              name: "nombre",
              title: "Nombre",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({ name: "cargo", title: "Cargo", type: "localeString" }),
            defineField({
              name: "foto",
              title: "Foto",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: "nombre", subtitle: "cargo.es", media: "foto" },
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Junta Directiva" }) },
});
