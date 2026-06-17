import { defineType, defineField } from "sanity";
import { UserIcon } from "@sanity/icons";

// ⚠️ DATOS DE MENORES: trátalos con confidencialidad. No se muestran en la web
// pública sin consentimiento de imagen/datos verificado (campo "consentimiento").
export const jugador = defineType({
  name: "jugador",
  title: "Jugador/a",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "nombre",
      title: "Nombre",
      type: "string",
      validation: (r) => r.required(),
      description: "Recomendado: solo nombre o nombre + inicial del apellido.",
    }),
    defineField({ name: "dorsal", title: "Dorsal", type: "number" }),
    defineField({
      name: "posicion",
      title: "Posición",
      type: "string",
      options: {
        list: [
          { title: "Portero/a", value: "portero" },
          { title: "Defensa", value: "defensa" },
          { title: "Centrocampista", value: "medio" },
          { title: "Delantero/a", value: "delantero" },
        ],
      },
    }),
    defineField({
      name: "foto",
      title: "Foto",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "consentimiento",
      title: "Consentimiento de imagen/datos verificado",
      type: "boolean",
      initialValue: false,
      description:
        "Obligatorio para poder mostrar nombre o foto en la web pública (RGPD, menores).",
    }),
  ],
  preview: { select: { title: "nombre", subtitle: "posicion", media: "foto" } },
});
