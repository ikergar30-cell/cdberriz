"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearSuscripcionSEPA } from "@/lib/stripe/sepa";
import { cambiarCuotaStripe, reAlinearRenovacion } from "@/lib/stripe/alinearFacturacion";
import { stripe } from "@/lib/stripe";
import { REEMBOLSO_DIAS, diasDesde } from "@/config/reembolso";
import type { EstadoSocio, OrigenSocio } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actionResult";
import { normalizarDni } from "@/lib/dni";
import { capitalizarPalabras } from "@/lib/texto";

// Server actions independientes del renderizado de la página: cada una debe
// re-verificar que quien llama es un empleado autenticado.
async function exigirEmpleado() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil) redirect("/admin/login");
}

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

  const titularId = txt("titular_id");

  // En la base de datos siempre queda igual, sin importar cómo lo escriba
  // quien lo teclee: DNI en mayúsculas, nombres/apellidos/población con
  // inicial mayúscula.
  const nombreTxt = txt("nombre");
  const apellidosTxt = txt("apellidos");
  const dniTxt = txt("dni");
  const poblacionTxt = txt("poblacion");

  return {
    nombre: nombreTxt ? capitalizarPalabras(nombreTxt) : "",
    apellidos: apellidosTxt ? capitalizarPalabras(apellidosTxt) : "",
    email: txt("email"),
    telefono: txt("telefono"),
    dni: dniTxt ? normalizarDni(dniTxt) : null,
    direccion: txt("direccion"),
    poblacion: poblacionTxt ? capitalizarPalabras(poblacionTxt) : null,
    codigo_postal: txt("codigo_postal"),
    fecha_nacimiento: txt("fecha_nacimiento"),
    origen: (txt("origen") ?? "cuota") as OrigenSocio,
    // Si es 2º titular de un bono familiar, paga quien figura como titular:
    // ignoramos cualquier dato de cuota/pago que llegara del formulario, no
    // solo confiamos en que la UI los oculte.
    tipo_abono_id: titularId ? null : txt("tipo_abono_id"),
    estado: (txt("estado") ?? "pendiente") as EstadoSocio,
    fecha_alta: txt("fecha_alta"),
    notas: txt("notas"),
    metodo_pago: titularId ? null : txt("metodo_pago"),
    iban: titularId ? null : txt("iban"),
    titular_id: titularId,
    miembros_familia: familia,
    // No es columna de BD — solo se usa para configurar Stripe
    _fecha_inicio_cobro: titularId ? null : txt("fecha_inicio_cobro"),
  };
}

export async function crearSocio(formData: FormData): Promise<ActionResult> {
  const { _fecha_inicio_cobro, ...datos } = leerCampos(formData);

  if (!datos.nombre || !datos.apellidos) {
    return { error: "Nombre y apellidos son obligatorios." };
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
      return { error: "La cuota seleccionada no tiene precio en Stripe configurado." };
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
  if (error) return { error: "No se pudo crear el socio: " + error.message };

  revalidatePath("/admin/socios");
  redirect("/admin/socios");
}

export async function actualizarSocio(id: string, formData: FormData): Promise<ActionResult> {
  const { _fecha_inicio_cobro, ...datos } = leerCampos(formData);
  void _fecha_inicio_cobro; // en edición no reconfiguramos Stripe automáticamente

  if (!datos.nombre || !datos.apellidos) {
    return { error: "Nombre y apellidos son obligatorios." };
  }

  const supabase = createClient();

  // Si se cambia la cuota manualmente y el socio ya tiene una suscripción de
  // Stripe, hay que actualizar el precio ahí también y cobrar la diferencia
  // ahora mismo (no esperar a la próxima renovación).
  const { data: socioActual, error: errActual } = await supabase
    .from("socios")
    .select("tipo_abono_id, stripe_subscription_id")
    .eq("id", id)
    .single();
  if (errActual) return { error: "No se pudo leer el socio: " + errActual.message };

  if (
    datos.tipo_abono_id &&
    datos.tipo_abono_id !== socioActual.tipo_abono_id &&
    socioActual.stripe_subscription_id
  ) {
    const admin = createAdminClient();
    const { data: cuota, error: errCuota } = await admin
      .from("tipos_abono")
      .select("stripe_price_id")
      .eq("id", datos.tipo_abono_id)
      .single();
    if (errCuota) return { error: "No se pudo leer la nueva cuota: " + errCuota.message };
    if (!cuota?.stripe_price_id) {
      return { error: "La cuota nueva no tiene precio en Stripe configurado." };
    }
    await cambiarCuotaStripe(socioActual.stripe_subscription_id, cuota.stripe_price_id);
  }

  // Se convierte en 2º titular a alguien que ya tenía suscripción propia:
  // hay que cancelarla, si no se le seguiría cobrando aparte de lo que pague
  // el titular nuevo. Lo exigimos también aquí, no solo en el formulario,
  // por si llega una petición sin pasar por la UI.
  if (datos.titular_id && socioActual.stripe_subscription_id) {
    const confirmado = formData.get("confirmar_cancelacion_stripe") === "on";
    if (!confirmado) {
      return {
        error:
          "Esta persona tiene una suscripción de pago activa. Marca la casilla de confirmación para cancelarla antes de vincularla como 2º titular.",
      };
    }
    await stripe.subscriptions.update(socioActual.stripe_subscription_id, { cancel_at_period_end: true });
  }

  const { error } = await supabase.from("socios").update(datos).eq("id", id);
  if (error) return { error: "No se pudo actualizar: " + error.message };

  revalidatePath("/admin/socios");
  revalidatePath(`/admin/socios/${id}`);
  redirect(`/admin/socios/${id}`);
}

export async function eliminarSocio(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("socios").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar: " + error.message };

  revalidatePath("/admin/socios");
  redirect("/admin/socios");
}

// ─── Cancelación y reembolso de la cuota ────────────────────────────────────

// Cancela la renovación automática pero el socio conserva su condición hasta
// el final del periodo ya pagado (Stripe deja de cobrar; el webhook
// "customer.subscription.deleted" pondrá el socio en "baja" cuando ese
// periodo termine de verdad, sin necesidad de tocar nada más aquí).
export async function cancelarRenovacion(id: string): Promise<ActionResult> {
  await exigirEmpleado();
  const admin = createAdminClient();

  const { data: socio, error } = await admin
    .from("socios")
    .select("stripe_subscription_id")
    .eq("id", id)
    .single();
  if (error || !socio) return { error: "Socio no encontrado." };
  if (!socio.stripe_subscription_id) {
    return { error: "Este socio no tiene una suscripción de Stripe que cancelar." };
  }

  await stripe.subscriptions.update(socio.stripe_subscription_id, { cancel_at_period_end: true });

  revalidatePath(`/admin/socios/${id}`);
}

// Deshace una cancelación programada (por si se pulsó por error o el socio
// cambia de opinión antes de que termine el periodo).
export async function reactivarRenovacion(id: string): Promise<ActionResult> {
  await exigirEmpleado();
  const admin = createAdminClient();

  const { data: socio, error } = await admin
    .from("socios")
    .select("stripe_subscription_id")
    .eq("id", id)
    .single();
  if (error || !socio) return { error: "Socio no encontrado." };
  if (!socio.stripe_subscription_id) return { error: "Este socio no tiene suscripción de Stripe." };

  await stripe.subscriptions.update(socio.stripe_subscription_id, { cancel_at_period_end: false });

  revalidatePath(`/admin/socios/${id}`);
}

// Reembolsa el último pago (solo si está dentro del plazo, ver
// src/config/reembolso.ts) y da de baja al socio de inmediato, incluyendo el
// segundo carné del abono familiar si lo tiene.
export async function reembolsarYCancelar(id: string): Promise<ActionResult> {
  await exigirEmpleado();
  const admin = createAdminClient();

  const { data: socio, error: errSocio } = await admin
    .from("socios")
    .select("stripe_subscription_id")
    .eq("id", id)
    .single();
  if (errSocio || !socio) return { error: "Socio no encontrado." };

  const { data: ultimoPago, error: errPago } = await admin
    .from("pagos")
    .select("id, stripe_invoice_id, fecha")
    .eq("socio_id", id)
    .eq("estado", "pagado")
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (errPago) return { error: errPago.message };
  if (!ultimoPago?.stripe_invoice_id) {
    return { error: "Este socio no tiene ningún pago de Stripe que reembolsar." };
  }
  if (diasDesde(ultimoPago.fecha) > REEMBOLSO_DIAS) {
    return {
      error: `Ya han pasado más de ${REEMBOLSO_DIAS} días desde el pago: fuera del plazo de reembolso automático.`,
    };
  }

  // Stripe ya no expone "payment_intent" directamente en la factura: hay que
  // consultar sus InvoicePayments (modelo de facturación actual de la API).
  const pagosFactura = await stripe.invoicePayments.list({
    invoice: ultimoPago.stripe_invoice_id,
    limit: 1,
  });
  const pagoStripe = pagosFactura.data[0]?.payment.payment_intent;
  const paymentIntentId = typeof pagoStripe === "string" ? pagoStripe : pagoStripe?.id;
  if (!paymentIntentId) return { error: "No se encontró el cobro en Stripe para reembolsar." };

  await stripe.refunds.create({ payment_intent: paymentIntentId });
  if (socio.stripe_subscription_id) {
    await stripe.subscriptions.cancel(socio.stripe_subscription_id);
  }

  const { error: errUpdatePago } = await admin
    .from("pagos")
    .update({ estado: "reembolsado" })
    .eq("id", ultimoPago.id);
  if (errUpdatePago) return { error: errUpdatePago.message };

  // Incluye el 2º carné del abono familiar (titular_id) — igual que en el webhook.
  const { error: errBaja } = await admin
    .from("socios")
    .update({ estado: "baja" })
    .or(`id.eq.${id},titular_id.eq.${id}`);
  if (errBaja) return { error: errBaja.message };

  revalidatePath(`/admin/socios/${id}`);
  revalidatePath("/admin/socios");
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

      // Mismo criterio que en el resto de altas: en la base de datos siempre
      // queda igual, sin importar cómo venga escrito en el CSV.
      const nombre = capitalizarPalabras(fila.nombre);
      const apellidos = capitalizarPalabras(fila.apellidos);
      const dni = fila.dni ? normalizarDni(fila.dni) : null;

      const cuota = cuotaMap.get(fila.cuota);
      if (!cuota) throw new Error(`Cuota desconocida: "${fila.cuota}"`);

      let stripeIds: { stripe_customer_id: string; stripe_subscription_id: string } | null = null;
      let estado: EstadoSocio = "pendiente";

      if (fila.iban) {
        if (!cuota.stripe_price_id) throw new Error("La cuota no tiene precio en Stripe");
        const res = await crearSuscripcionSEPA({
          nombre,
          apellidos,
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
        nombre,
        apellidos,
        email: fila.email || null,
        telefono: fila.telefono || null,
        dni,
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

      resultados.push({ ok: true, nombre, apellidos });
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

// Mueve la fecha de renovación de TODAS las suscripciones de Stripe ya
// activas (altas anteriores a un cambio de política de facturación) a la
// próxima fecha objetivo (ver src/config/facturacion.ts). No cobra ni
// devuelve nada: solo reprograma cuándo cae el próximo cobro.
export async function sincronizarRenovaciones(): Promise<
  | { error: string }
  | { error?: undefined; actualizadas: number; yaAlineadas: number; noActivas: number; errores: string[] }
> {
  await exigirEmpleado();
  const admin = createAdminClient();

  const { data: socios, error } = await admin
    .from("socios")
    .select("id, nombre, apellidos, stripe_subscription_id")
    .not("stripe_subscription_id", "is", null);
  if (error) return { error: error.message };

  let actualizadas = 0;
  let yaAlineadas = 0;
  let noActivas = 0;
  const errores: string[] = [];

  for (const s of socios ?? []) {
    try {
      const resultado = await reAlinearRenovacion(s.stripe_subscription_id as string);
      if (resultado === "ya_alineada") yaAlineadas++;
      else if (resultado === "no_activa") noActivas++;
      else actualizadas++;
    } catch (e) {
      errores.push(`${s.nombre} ${s.apellidos}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { actualizadas, yaAlineadas, noActivas, errores };
}
