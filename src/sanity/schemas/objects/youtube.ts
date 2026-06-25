import { defineType, defineField } from "sanity";
import { PlayIcon } from "@sanity/icons";

// Vídeo de YouTube incrustable dentro del cuerpo de una noticia.
export const youtube = defineType({
  name: "youtube",
  title: "Vídeo de YouTube",
  type: "object",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "url",
      title: "URL del vídeo",
      type: "url",
      description: "Pega el enlace del vídeo (p. ej. https://www.youtube.com/watch?v=…).",
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { url: "url" },
    prepare: ({ url }) => ({ title: "Vídeo de YouTube", subtitle: url }),
  },
});
