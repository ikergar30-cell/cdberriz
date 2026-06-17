import { defineType, defineField } from "sanity";

// Texto corto traducible (castellano y euskera).
export const localeString = defineType({
  name: "localeString",
  title: "Texto corto (es/eu)",
  type: "object",
  options: { columns: 2 },
  fields: [
    defineField({ name: "es", title: "Castellano", type: "string" }),
    defineField({ name: "eu", title: "Euskera", type: "string" }),
  ],
});
