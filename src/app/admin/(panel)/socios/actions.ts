"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearSuscripcionSEPA } from "@/lib/stripe/sepa";
import type { EstadoSocio } from "@/lib/supabase/types";

function leerCampos(formData: FormData) {
  const txt = (k: string) => {
    const v = formData.get(k);
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  };

  const familia = (txt("miembros_familia") || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((nombre) => ({ nombre }));

  return {
    nombre: txt("nombre") ?? "",
    apellidos: txt("apellidos") ?? "",
    email: txt("email"),
    telefono: txt("telefono"),
    dni: txt("dni"),
    direccion: txt("direccion"),
    fecha_nacimiento: txt("fecha_nacimiento"),
    tipo_abono_id: txt("tipo_abono_id"),
    estado: (txt("estado") ?? "pendiente") as EstadoSocio,
    fecha_alta: txt("fecha_alta"),
    notas: txt("notas"),
    metodo_pago: txt("metodo_pago"),
    iban: txt("iban"),
    miembros_familia: familia,
    // No es columna de BD — solo se usa para configurar Stripe
    _fecha_inicio_cobro: txt("fecha_inicio_cobro"),
  };
}

export async function crearSocio(formData: FormData) {
  const { _fecha_inicio_cobro, ...datos } = leerCampos(formData);

  if (!datos.nombre || !datos.apellidos) {
    throw new Error("Nombre y apellidos son obligatorios.");
  }

  let stripeIds: {
    stripe_customer_id: string;
    stripe_subscription_id: string;
  } | null = null;

  // Si el método de pago es SEPA y hay IBAN, damos de alta en Stripe
  if (datos.metodo_pago === "sepa_debit" && datos.iban && datos.tipo_abono_id && datos.email) {
    const admin = createAdminClient();
    const { data: cuota } = await admin
      .from("tipos_abono")
      .select("stripe_price_id, clave")
      .eq("id", datos.tipo_abono_id)
      .single();

    if (!cuota?.stripe_price_id) {
      throw new Error("La cuota seleccionada no tiene precio en Stripe configurado.");
    }

    const res = await crearSuscripcionSEPA({
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      email: datos.email,
      telefono: datos.telefono,
      iban: datos.iban,
      stripe_price_id: cuota.stripe_price_id,
      tipo_abono_id: datos.tipo_abono_id,
      clave: cuota.clave,
      fecha_inicio_cobro: _fecha_inicio_cobro,
    });

    stripeIds = { stripe_customer_id: res.stripe_customer_id, stripe_subscription_id: res.stripe_subscription_id };
    datos.estado = res.estado;
  }

  const supabase = createClient();
  const { error } = await supabase.from("socios").insert({
    ...datos,
    ...stripeIds,
  });
  if (error) throw new Error("No se pudo crear el socio: " + error.message);

  revalidatePath("/admin/socios");
  redirect("/admin/socios");
}

export async function actualizarSocio(id: string, formData: FormData) {
  const { _fecha_inicio_cobro, ...datos } = leerCampos(formData);
  void _fecha_inicio_cobro; // en edición no reconfiguramos Stripe automáticamente

  if (!datos.nombre || !datos.apellidos) {
    throw new Error("Nombre y apellidos son obligatorios.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("socios").update(datos).eq("id", id);
  if (error) throw new Error("No se pudo actualizar: " + error.message);

  revalidatePath("/admin/socios");
  revalidatePath(`/admin/socios/${id}`);
  redirect("/admin/socios");
}

export async function eliminarSocio(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("socios").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar: " + error.message);

  revalidatePath("/admin/socios");
  redirect("/admin/socios");
}

// ─── Importación masiva desde CSV ───────────────────────────────────────────

export interface FilaImport {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  dni?: string;
  fecha_nacimiento?: string;
  cuota: string; // clave: joven | individual | familiar | jubilado
  iban?: string;
  fecha_alta?: string;
  fecha_inicio_cobro?: string;
  notas?: string;
}

export interface ResultadoFila {
  ok: boolean;
  nombre: string;
  apellidos: string;
  error?: string;
}

export async function importarSocios(filas: FilaImport[]): Promise<ResultadoFila[]> {
  // Verificar que quien llama es un empleado autenticado. Server actions son
  // invocables de forma independiente al renderizado de la página, así que no
  // basta con que el layout del panel las oculte visualmente.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil) redirect("/admin/login");

  const admin = createAdminClient();

  // Cargar todos los tipos de abono una sola vez
  const { data: tipos } = await admin
    .from("tipos_abono")
    .select("id, clave, stripe_price_id")
    .eq("activo", true);

  const cuotaMap = new Map(
    (tipos ?? []).map((t) => [t.clave, { id: t.id, stripe_price_id: t.stripe_price_id as string | null }])
  );

  const resultados: ResultadoFila[] = [];

  for (const fila of filas) {
    try {
      if (!fila.nombre || !fila.apellidos) throw new Error("Nombre y apellidos son obligatorios");
      if (!fila.email) throw new Error("Email obligatorio");

      const cuota = cuotaMap.get(fila.cuota);
      if (!cuota) throw new Error(`Cuota desconocida: "${fila.cuota}"`);

      let stripeIds: { stripe_customer_id: string; stripe_subscription_id: string } | null = null;
      let estado: EstadoSocio = "pendiente";

      if (fila.iban) {
        if (!cuota.stripe_price_id) throw new Error("La cuota no tiene precio en Stripe");
        const res = await crearSuscripcionSEPA({
          nombre: fila.nombre,
          apellidos: fila.apellidos,
          email: fila.email,
          telefono: fila.telefono,
          iban: fila.iban,
          stripe_price_id: cuota.stripe_price_id,
          tipo_abono_id: cuota.id,
          clave: fila.cuota,
          fecha_inicio_cobro: fila.fecha_inicio_cobro,
        });
        stripeIds = res;
        estado = res.estado;
      }

      const { error } = await admin.from("socios").insert({
        nombre: fila.nombre,
        apellidos: fila.apellidos,
        email: fila.email || null,
        telefono: fila.telefono || null,
        dni: fila.dni || null,
        fecha_nacimiento: fila.fecha_nacimiento || null,
        tipo_abono_id: cuota.id,
        iban: fila.iban || null,
        fecha_alta: fila.fecha_alta || null,
        notas: fila.notas || null,
        metodo_pago: fila.iban ? "sepa_debit" : "manual",
        estado,
        ...stripeIds,
      });

      if (error) throw new Error(error.message);

      resultados.push({ ok: true, nombre: fila.nombre, apellidos: fila.apellidos });
    } catch (e) {
      resultados.push({
        ok: false,
        nombre: fila.nombre || "?",
        apellidos: fila.apellidos || "?",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return resultados;
}
