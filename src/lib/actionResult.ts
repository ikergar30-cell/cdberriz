// Resultado de una server action que puede fallar de forma "esperada"
// (validación, regla de negocio…). IMPORTANTE: las server actions deben
// DEVOLVER estos errores, nunca lanzarlos con throw — en producción Next.js
// oculta el mensaje real de cualquier error lanzado en una server action (por
// seguridad, para no filtrar detalles del servidor) y el cliente solo ve un
// mensaje genérico. Devolviendo el error como valor, el texto siempre llega
// intacto.
export type ActionResult = { error: string } | undefined;

// Mensaje de repuesto para cuando SÍ salta un error inesperado (uno que no
// hemos anticipado con ActionResult) y llega en crudo al cliente.
export const ERROR_GENERICO = "Ha ocurrido un error. Inténtalo de nuevo.";
