import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { crearInvitado } from "./actions";
import { BotonRevocar } from "./BotonRevocar";
import { CopiarEnlace } from "./CopiarEnlace";
import { CabeceraPagina, CuerpoPagina } from "../ui";

interface Invitado {
  id: string;
  nombre: string;
  motivo: string | null;
  expira_en: string;
  usos_maximos: number;
  revocado_en: string | null;
  creado_en: string;
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function estadoDe(inv: Invitado, usados: number): { texto: string; cls: string } {
  if (inv.revocado_en) return { texto: "Revocada", cls: "bg-neutral-100 text-neutral-500" };
  if (new Date(inv.expira_en) < new Date()) return { texto: "Caducada", cls: "bg-neutral-100 text-neutral-500" };
  if (usados >= inv.usos_maximos) return { texto: "Agotada", cls: "bg-amber-100 text-amber-800" };
  return { texto: "Vigente", cls: "bg-green-100 text-green-700" };
}

// Valor por defecto del selector de caducidad: hoy a las 23:59, en el
// formato que espera <input type="datetime-local">.
function hoyMedianoche() {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  searchParams: { error?: string; creado?: string };
}

export default async function InvitadosPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data } = await supabase
    .from("invitados")
    .select("id, nombre, motivo, token, expira_en, usos_maximos, revocado_en, creado_en")
    .order("creado_en", { ascending: false });

  const invitados = (data as (Invitado & { token: string })[]) ?? [];

  const { data: entradasTodas } = await supabase.from("entradas_invitado").select("invitado_id");
  const usosPorInvitado = new Map<string, number>();
  for (const e of entradasTodas ?? []) {
    usosPorInvitado.set(e.invitado_id, (usosPorInvitado.get(e.invitado_id) ?? 0) + 1);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const recienCreado = searchParams.creado ? invitados.find((i) => i.id === searchParams.creado) : null;

  return (
    <>
      <CabeceraPagina
        titulo="Invitados"
        descripcion="Carnés temporales para gente sin cuota (prensa, familiares, invitados puntuales…). Caducan solos en la fecha que pongas, o antes si los revocas."
      />
      <CuerpoPagina>

      {searchParams.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {recienCreado && (
        <div className="mt-6 max-w-md rounded-2xl border border-green-200 bg-green-50 p-6">
          <p className="font-display text-lg font-bold text-green-800">
            Invitación creada para {recienCreado.nombre}
          </p>
          <p className="mt-1 text-sm text-green-700">
            Envíale este enlace (WhatsApp, email…): lo abre desde su móvil y le sale su carné con QR
            para enseñar en la entrada.
          </p>
          <div className="mt-3">
            <CopiarEnlace url={`${siteUrl}/invitacion/${recienCreado.token}`} />
          </div>
        </div>
      )}

      {/* Nueva invitación */}
      <div className="mt-8 max-w-lg rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold uppercase text-neutral-900">Nueva invitación</h2>
        <form action={crearInvitado} className="mt-4 space-y-4">
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-semibold text-neutral-700">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              placeholder="Nombre y apellidos"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
          </div>
          <div>
            <label htmlFor="motivo" className="mb-1 block text-sm font-semibold text-neutral-700">
              Motivo (opcional)
            </label>
            <input
              id="motivo"
              name="motivo"
              type="text"
              placeholder="Ej: prensa, familiar de jugador/a…"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expira" className="mb-1 block text-sm font-semibold text-neutral-700">
                Caduca el
              </label>
              <input
                id="expira"
                name="expira"
                type="datetime-local"
                required
                defaultValue={hoyMedianoche()}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
              />
            </div>
            <div>
              <label htmlFor="usos_maximos" className="mb-1 block text-sm font-semibold text-neutral-700">
                Usos máximos
              </label>
              <input
                id="usos_maximos"
                name="usos_maximos"
                type="number"
                min={1}
                defaultValue={1}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-azul focus:ring-1 focus:ring-azul"
              />
              <p className="mt-1 text-xs text-neutral-400">Normalmente 1 (una entrada, un partido).</p>
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-azul px-5 py-2 text-sm font-semibold text-white transition hover:bg-azul-700"
          >
            Crear invitación
          </button>
        </form>
      </div>

      {/* Listado */}
      <h2 className="mt-10 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">
        Todas las invitaciones
      </h2>
      {invitados.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Todavía no has creado ninguna.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Caduca</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invitados.map((inv) => {
                const usados = usosPorInvitado.get(inv.id) ?? 0;
                const estado = estadoDe(inv, usados);
                return (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-semibold text-neutral-900">{inv.nombre}</td>
                    <td className="px-4 py-3 text-neutral-600">{inv.motivo ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatearFecha(inv.expira_en)}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {usados}/{inv.usos_maximos}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado.cls}`}>
                        {estado.texto}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/invitados/${inv.id}`}
                          className="text-xs font-semibold text-azul hover:underline"
                        >
                          Ver enlace
                        </Link>
                        {estado.texto === "Vigente" && <BotonRevocar id={inv.id} nombre={inv.nombre} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </CuerpoPagina>
    </>
  );
}
