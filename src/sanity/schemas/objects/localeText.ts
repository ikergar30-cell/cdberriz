import { defineType, defineField } from "sanity";

// Texto largo traducible (castellano y euskera).
export const localeText = defineType({
  name: "localeText",
  title: "Texto largo (es/eu)",
  type: "object",
  fields: [
    defineField({ name: "es", title: "Castellano", type: "text", rows: 4 }),
    defineField({ name: "eu", title: "Euskera", type: "text", rows: 4 }),
  ],
});
