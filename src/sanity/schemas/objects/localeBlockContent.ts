import { defineType, defineField, defineArrayMember } from "sanity";

const contenido = [
  defineArrayMember({ type: "block" }),
  defineArrayMember({ type: "image", options: { hotspot: true } }),
];

// Contenido enriquecido traducible (castellano y euskera).
export const localeBlockContent = defineType({
  name: "localeBlockContent",
  title: "Contenido (es/eu)",
  type: "object",
  fields: [
    defineField({ name: "es", title: "Castellano", type: "array", of: contenido }),
    defineField({ name: "eu", title: "Euskera", type: "array", of: contenido }),
  ],
});
