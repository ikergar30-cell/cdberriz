// TEMPORAL — vista previa del menú móvil para revisarlo sin sesión. Se borra.
import { NavPanel, type SeccionNav } from "@/app/admin/(panel)/NavPanel";
import { CabeceraPagina, CuerpoPagina, TarjetaCifra } from "@/app/admin/(panel)/ui";

const secciones: SeccionNav[] = [
  { titulo: null, items: [
    { href: "/x/a", label: "Resumen", icono: "resumen" },
    { href: "/x/b", label: "Buzón de contacto", icono: "buzon" }] },
  { titulo: "Socios", items: [
    { href: "/x/c", label: "Socios", icono: "socios" },
    { href: "/x/d", label: "Familias / Jugadores", icono: "familias" },
    { href: "/x/e", label: "Cuotas", icono: "cuotas" }] },
  { titulo: "Control de acceso", items: [
    { href: "/x/f", label: "Verificar carné", icono: "verificar" },
    { href: "/x/g", label: "Carnés físicos", icono: "carnets" },
    { href: "/x/h", label: "Asistencia", icono: "asistencia" },
    { href: "/x/i", label: "Invitados", icono: "invitados" }] },
  { titulo: "Contenido", items: [
    { href: "/x/j", label: "Publicar noticia", externo: true, icono: "noticia" },
    { href: "/x/k", label: "Publicar evento", externo: true, icono: "evento" },
    { href: "/x/l", label: "Gestor de contenidos", externo: true, icono: "studio" }] },
  { titulo: "Resguardos", items: [
    { href: "/x/m", label: "Árbitros", icono: "arbitros" },
    { href: "/x/n", label: "Entrenadores", icono: "entrenadores" }] },
  { titulo: "Finanzas", items: [{ href: "/x/o", label: "Informe Stripe", icono: "finanzas" }] },
  { titulo: "Administración", items: [{ href: "/x/p", label: "Empleados", icono: "empleados" }] },
];

export default function PreviewMenu() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 md:h-screen md:flex-row md:overflow-hidden">
      <NavPanel secciones={secciones} nombre="Iker Garcia" esAdmin
        logout={<button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-white/55">Cerrar sesión</button>} />
      <main className="min-w-0 flex-1 md:overflow-y-auto md:p-2.5">
        <div className="min-h-full bg-white md:rounded-2xl">
          <CabeceraPagina titulo="Socios" descripcion="21 de cuota y 9 por hijo/a jugando." />
          <CuerpoPagina>
            <div className="grid gap-4 sm:grid-cols-2">
              <TarjetaCifra label="Socios activos" valor={554} tono="verde" />
              <TarjetaCifra label="Pendientes" valor={12} tono="ambar" />
            </div>
          </CuerpoPagina>
        </div>
      </main>
    </div>
  );
}
