// Datos LOCALES de los equipos cadetes (montaje previo, sin publicar).
// Fotos recortadas (Vision, macOS) y normalizadas 3:4. Dorsales del PDF de
// plantillas (1ª equipación); la web ordena por dorsal.
// ⚠️ DATOS DE MENORES: no publicar sin consentimiento de imagen (RGPD).
export type JugadorEquipo = { nombre: string; apellidos: string; dorsal?: number; foto?: string };
export type MiembroTecnico = { rol: string; nombre: string };
export type EquipoLocal = { slug: string; nombre: string; grupo: string; jugadores: JugadorEquipo[]; cuerpoTecnico: MiembroTecnico[] };
export const EQUIPOS_CADETES: Record<string, EquipoLocal> = {
  "cadete-a": { slug: "cadete-a", nombre: "Cadete A", grupo: "Fútbol Federado", jugadores: [
          {
                "nombre": "Izei",
                "apellidos": "Abendibar Maiztegi",
                "foto": "cadete-a/izei.png",
                "dorsal": 1
          },
          {
                "nombre": "Markel",
                "apellidos": "Goñi Ortuzar",
                "foto": "cadete-a/markel.png",
                "dorsal": 2
          },
          {
                "nombre": "Martin",
                "apellidos": "Petite Garcia",
                "foto": "cadete-a/martin-petite.png",
                "dorsal": 3
          },
          {
                "nombre": "Mario",
                "apellidos": "Justel Rubio",
                "foto": "cadete-a/mario.png",
                "dorsal": 4
          },
          {
                "nombre": "Luken",
                "apellidos": "Arriaga Etxanobe",
                "foto": "cadete-a/luken.png",
                "dorsal": 5
          },
          {
                "nombre": "Ipar",
                "apellidos": "Leanizbarrutia Virumbrales",
                "foto": "cadete-a/ipar.png",
                "dorsal": 6
          },
          {
                "nombre": "Eiden",
                "apellidos": "Garcia Sanchez",
                "foto": "cadete-a/eiden.png",
                "dorsal": 7
          },
          {
                "nombre": "Manex",
                "apellidos": "Balerdi Guerenabarrena",
                "foto": "cadete-a/manex.png",
                "dorsal": 8
          },
          {
                "nombre": "Gari",
                "apellidos": "Aulestiarte Eguren",
                "foto": "cadete-a/gari.png",
                "dorsal": 9
          },
          {
                "nombre": "Garai",
                "apellidos": "Mugarza Galarraga",
                "foto": "cadete-a/garai.png",
                "dorsal": 10
          },
          {
                "nombre": "Martin",
                "apellidos": "Goikuria Zabala",
                "foto": "cadete-a/goiku.png",
                "dorsal": 11
          },
          {
                "nombre": "Liam",
                "apellidos": "San Cipriano Keen",
                "foto": "cadete-a/liam.png",
                "dorsal": 17
          },
          {
                "nombre": "Steven",
                "apellidos": "Gutierrez Herrera",
                "foto": "cadete-a/steven.png",
                "dorsal": 21
          },
          {
                "nombre": "Aiur",
                "apellidos": "Etxezarraga Angoitia",
                "foto": "cadete-a/aiur.png",
                "dorsal": 24
          }
    ], cuerpoTecnico: [
          {
                "rol": "Entrenador",
                "nombre": ""
          },
          {
                "rol": "Segundo entrenador",
                "nombre": ""
          },
          {
                "rol": "Delegado/a",
                "nombre": ""
          }
    ] },
  "cadete-b": { slug: "cadete-b", nombre: "Cadete B", grupo: "Fútbol Federado", jugadores: [
          {
                "nombre": "Lier",
                "apellidos": "Biritxinaga Azula",
                "foto": "cadete-b/lier.png",
                "dorsal": 1
          },
          {
                "nombre": "Alain",
                "apellidos": "Arenas Peñalba",
                "foto": "cadete-b/alain.png",
                "dorsal": 3
          },
          {
                "nombre": "Pablo",
                "apellidos": "Sanchez Agudo",
                "foto": "cadete-b/pablo-sanchez.png",
                "dorsal": 4
          },
          {
                "nombre": "Oihan",
                "apellidos": "Borges Dominguez",
                "foto": "cadete-b/borges.png",
                "dorsal": 5
          },
          {
                "nombre": "Unax",
                "apellidos": "Zubizarreta Sagarminaga",
                "foto": "cadete-b/unax.png",
                "dorsal": 6
          },
          {
                "nombre": "Hanot",
                "apellidos": "Urreta Iriondo",
                "foto": "cadete-b/hanot.png",
                "dorsal": 7
          },
          {
                "nombre": "Oier",
                "apellidos": "Fernandez Perez",
                "foto": "cadete-b/oier-fernandez.png",
                "dorsal": 8
          },
          {
                "nombre": "Ibon",
                "apellidos": "Guisado Eguren",
                "foto": "cadete-b/ibon.png",
                "dorsal": 9
          },
          {
                "nombre": "Paul Adrian",
                "apellidos": "Obada",
                "foto": "cadete-b/obada.png",
                "dorsal": 10
          },
          {
                "nombre": "Gorka",
                "apellidos": "Basauri Aguirre",
                "foto": "cadete-b/gorka.png",
                "dorsal": 13
          },
          {
                "nombre": "Liher",
                "apellidos": "Santamaria Gonzalez",
                "foto": "cadete-b/liher.png",
                "dorsal": 16
          },
          {
                "nombre": "Enaitz",
                "apellidos": "Lasagabaster Urcelay",
                "foto": "cadete-b/enaitz.png",
                "dorsal": 18
          },
          {
                "nombre": "Julen",
                "apellidos": "Ramirez Rodriguez",
                "foto": "cadete-b/julen.png",
                "dorsal": 20
          },
          {
                "nombre": "Aimar",
                "apellidos": "Aguirre Solis",
                "foto": "cadete-b/aimar.png",
                "dorsal": 21
          },
          {
                "nombre": "Oier",
                "apellidos": "Bezanilla Lopez",
                "foto": "cadete-b/oier-bezanilla.png",
                "dorsal": 24
          },
          {
                "nombre": "Joaquin Adriano Rola",
                "apellidos": "Ruiz Canepa",
                "foto": "cadete-b/joaquin.png"
          }
    ], cuerpoTecnico: [
          {
                "rol": "Entrenador",
                "nombre": ""
          },
          {
                "rol": "Segundo entrenador",
                "nombre": ""
          },
          {
                "rol": "Delegado/a",
                "nombre": ""
          }
    ] },
};
