// Consultas GROQ para leer contenido de Sanity.

export const noticiasRecientesQuery = `
*[_type == "noticia"] | order(fecha desc)[0...3]{
  _id, titulo, "slug": slug.current, categoria, fecha, extracto, portada
}`;

export const todasNoticiasQuery = `
*[_type == "noticia"] | order(fecha desc){
  _id, titulo, "slug": slug.current, categoria, fecha, extracto, portada
}`;

export const noticiaPorSlugQuery = `
*[_type == "noticia" && slug.current == $slug][0]{
  _id, titulo, "slug": slug.current, categoria, fecha, extracto, cuerpo,
  portada, "portadaDims": portada.asset->metadata.dimensions
}`;

export const eventosProximosQuery = `
*[_type == "evento" && fecha >= now()] | order(fecha asc)[0...3]{
  _id, titulo, fecha, lugar, descripcion
}`;

export const equiposQuery = `
*[_type == "equipo"] | order(orden asc, categoria asc){
  _id, nombre, "slug": slug.current, grupo, categoria, temporada, foto, descripcion
}`;

export const sociosTiposQuery = `
*[_type == "socioTipoAbono"] | order(orden asc, precio asc){
  _id, nombre, precio, descripcion, beneficios, destacado
}`;

export const paginaInicioQuery = `
*[_type == "paginaInicio"][0]{ heroTitulo, heroSubtitulo, heroImagen }`;

export const juntaDirectivaQuery = `
*[_type == "juntaDirectiva"][0]{ miembros[]{ nombre, cargo, foto } }`;

export const documentosQuery = `
*[_type == "documentoDescargable"] | order(fecha desc){
  _id, titulo, categoria, descripcion, fecha, "url": archivo.asset->url
}`;

export const sponsorsQuery = `
*[_type == "sponsor" && activo == true] | order(orden asc, nombre asc){
  _id, nombre, url, nivel, logo
}`;

export const documentosSociosQuery = `
*[_type == "documentoDescargable" && categoria == "socios"] | order(fecha desc)[0...5]{
  _id, titulo, fecha, "url": archivo.asset->url
}`;
