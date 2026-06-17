import createImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

// Genera la URL de una imagen de Sanity (con opciones .width(), .height(), etc.)
export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
