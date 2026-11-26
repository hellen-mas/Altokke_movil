
import "jsr:@supabase/functions-js@^2.119.0/edge-runtime.d.ts";
import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@2";
import {
  enviarPushExpo,
  type ExpoPushMessage,
} from "../_shared/expoPush.ts";

interface OpenpayWebhook {
  type?: string;
  verification_code?: string;
  transaction?: {
    id?: string;
    order_id?: string;
  };
}

interface OpenpayTransaction {
  id?: string;
  order_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  transaction_type?: string;
  operation_type?: string;
}

interface TokenPush {
  id: string;
  token: string;
}

function responder(data: Record<string, unknown>, status = 200) {
  return Response.json(data, { status });
}

async function notificarPago(
  admin: SupabaseClient,
  usuarioId: string,
  chargeId: string,
  tipo: "recarga_aprobada" | "recarga_fallida",
  monto: number,
) {
  // 1. Reclamar el evento para evitar notificaciones duplicadas.
  const eventHash = `openpay:${tipo}:${chargeId}`;

  const { data: reclamos, error: errorReclamo } =
    await admin.rpc("claim_push_webhook_event", {
      p_event_hash: eventHash,
      p_usuario_id: usuarioId,
      p_tipo: tipo,
    });

  if (errorReclamo) {
    throw new Error(
      `Error registrando evento de pago: ${errorReclamo.message}`,
    );
  }

  const reclamo = reclamos?.[0] as
    | { event_id: string; claimed: boolean }
    | undefined;

  if (!reclamo?.event_id) {
    throw new Error("No se pudo registrar el evento de notificación.");
  }

  if (!reclamo.claimed) {
    return {
      duplicado: true,
      enviados: 0,
    };
  }

  const eventId = reclamo.event_id;

  try {
    // 2. Buscar dispositivos del usuario.
    const { data: tokens, error: errorTokens } = await admin
      .from("push_tokens")
      .select("id, token")
      .eq("usuario_id", usuarioId)
      .eq("plataforma", "android");

    if (errorTokens) {
      throw new Error(errorTokens.message);
    }

    const dispositivos = (tokens ?? []) as TokenPush[];

    if (dispositivos.length === 0) {
      await admin
        .from("push_webhook_events")
        .update({
          estado: "completado",
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", eventId);

      return {
        duplicado: false,
        enviados: 0,
      };
    }

    // 3. Preparar mensajes.
    const aprobado = tipo === "recarga_aprobada";

    const mensajes: ExpoPushMessage[] = dispositivos.map(
      (dispositivo) => ({
        to: dispositivo.token,
        title: aprobado
          ? "¡Recarga exitosa!"
          : "Recarga no completada",
        body: aprobado
          ? `Tu recarga de S/ ${monto.toFixed(2)} se acreditó correctamente en tu billetera.`
          : `Tu recarga de S/ ${monto.toFixed(2)} no pudo completarse. Puedes intentar nuevamente.`,
        sound: "default",
        priority: "high",
        channelId: "pagos_v2",
        data: {
          categoria: "pagos",
          tipo,
          movimiento_id: chargeId,
          ruta: "/(conductor)/billetera",
        },
      }),
    );

    // 4. Enviar mediante Expo.
    const resultado = await enviarPushExpo(
      mensajes,
      Deno.env.get("EXPO_ACCESS_TOKEN"),
    );

    // 5. Registrar el evento como completado.
    await admin
      .from("push_webhook_events")
      .update({
        estado: "completado",
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", eventId);

    // 6. Eliminar tokens inválidos.
    for (const token of resultado.tokensInvalidos) {
      await admin
        .from("push_tokens")
        .delete()
        .eq("usuario_id", usuarioId)
        .eq("token", token);
    }

    // 7. Guardar recibos de Expo.
    const dispositivosPorToken = new Map(
      dispositivos.map((d) => [d.token, d]),
    );

    const recibos = resultado.tickets.flatMap((ticket) => {
      if (ticket.status !== "ok" || !ticket.ticketId) {
        return [];
      }

      const dispositivo = dispositivosPorToken.get(ticket.token);

      if (!dispositivo) return [];

      return [{
        ticket_id: ticket.ticketId,
        usuario_id: usuarioId,
        push_token_id: dispositivo.id,
        categoria: "pagos",
        tipo,
        estado: "pendiente",
      }];
    });

    if (recibos.length > 0) {
      const { error } = await admin
        .from("push_receipts")
        .upsert(recibos, {
          onConflict: "ticket_id",
          ignoreDuplicates: true,
        });

      if (error) {
        console.error(
          "[OPENPAY] Error guardando recibos:",
          error.message,
        );
      }
    }

    return {
      duplicado: false,
      enviados: resultado.aceptadosPorExpo,
      fallidos: resultado.fallidos,
    };

  } catch (error) {
    const mensaje = error instanceof Error
      ? error.message
      : "Error enviando notificación de pago";

    await admin
      .from("push_webhook_events")
      .update({
        estado: "fallido",
        ultimo_error: mensaje,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", eventId);

    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return responder({ ok: false }, 405);
  }

  const webhookUser = Deno.env.get("OPENPAY_WEBHOOK_USER");
  const webhookPassword = Deno.env.get("OPENPAY_WEBHOOK_PASSWORD");

  if (!webhookUser || !webhookPassword) {
    return responder({ ok: false }, 500);
  }

  // Autenticación HTTP Basic configurada en Openpay.
  const authorization = req.headers.get("Authorization");
  const expected = `Basic ${btoa(`${webhookUser}:${webhookPassword}`)}`;

  if (authorization !== expected) {
    return responder({ ok: false }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const merchantId = Deno.env.get("OPENPAY_MERCHANT_ID");
  const privateKey = Deno.env.get("OPENPAY_PRIVATE_KEY");

  if (!supabaseUrl || !serviceKey || !merchantId || !privateKey) {
    return responder({ ok: false }, 500);
  }

  let event: OpenpayWebhook;

  try {
    event = await req.json();
  } catch {
    return responder({ ok: false }, 400);
  }

  // Verificación inicial del webhook.
  if (event.type === "verification") {
    console.info(
      "[OPENPAY] Código de verificación:",
      event.verification_code,
    );

    return responder({
      ok: true,
      verification_code: event.verification_code ?? null,
    });
  }

  const eventType = event.type;

  if (
    !["charge.succeeded", "charge.failed", "charge.cancelled"].includes(
      eventType ?? "",
    )
  ) {
    // Aceptar eventos desconocidos sin acreditarlos.
    return responder({ ok: true, ignorado: true });
  }

  const transactionId = event.transaction?.id;

  if (!transactionId) {
    return responder({ ok: false, error: "Falta el ID de transacción." }, 400);
  }

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const basicAuth = btoa(`${privateKey}:`);

    // Consultar el cargo directamente a Openpay.
    // No confiamos únicamente en el cuerpo del webhook.
    const chargeResponse = await fetch(
      `https://sandbox-api.openpay.pe/v1/${merchantId}/charges/${encodeURIComponent(transactionId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      },
    );

    if (!chargeResponse.ok) {
      console.error("[OPENPAY] No se pudo verificar el cargo.");

      return responder({
        ok: false,
        error: "No se pudo verificar la transacción.",
      }, 500);
    }

    const charge = await chargeResponse.json() as OpenpayTransaction;

    if (
      charge.id !== transactionId ||
      charge.transaction_type !== "charge" ||
      charge.operation_type !== "in" ||
      !charge.order_id ||
      charge.currency !== "PEN"
    ) {
      return responder({
        ok: false,
        error: "Transacción no válida.",
      }, 400);
    }

    // Buscar el intento pendiente en nuestra billetera.
    const { data: movimiento, error: movimientoError } =
      await admin
        .from("billetera_movimientos")
        .select("id,conductor_id,monto,estado")
        .eq("openpay_order_id", charge.order_id)
        .eq("tipo", "recarga")
        .maybeSingle();

    if (movimientoError) {
      console.error("[OPENPAY DB]", movimientoError.message);
      return responder({ ok: false }, 500);
    }

    // La transacción no pertenece a una recarga ALTOKKE.
    if (!movimiento) {
      console.warn("[OPENPAY] Orden sin intento asociado:", charge.order_id);
      return responder({ ok: true, ignorado: true });
    }

    if (
      Number(movimiento.monto) !== Number(charge.amount)
    ) {
      console.error("[OPENPAY] El monto no coincide.");

      return responder({
        ok: false,
        error: "El monto no coincide con el intento.",
      }, 400);
    }

    // 1. Pago aprobado.
    if (eventType === "charge.succeeded") {
      if (charge.status !== "completed") {
        return responder({
          ok: false,
          error: "El cargo todavía no está completado.",
        }, 500);
      }

      const { error } = await admin.rpc(
        "confirmar_recarga_openpay",
        {
          p_conductor_id: movimiento.conductor_id,
          p_monto: movimiento.monto,
          p_order_id: charge.order_id,
          p_charge_id: charge.id,
        },
      );

      if (error) {
        console.error("[OPENPAY] Error acreditando saldo:", error.message);
        return responder({ ok: false }, 500);
      }

      // La acreditacion ya fue confirmada por PostgreSQL
      // Ahora notificamos al conductor
      const notificacion = await notificarPago(
        admin,
        movimiento.conductor_id,
        charge.id,
        "recarga_aprobada",
        Number(movimiento.monto),
      );

      console.info("[OPENPAY] Notificación de recarga:", notificacion);

      return responder({
        ok: true,
        estado: "completado",
        notificacion,
      });
    }

    // 2. Pago rechazado o cancelado.
    if (
      eventType === "charge.failed" ||
      eventType === "charge.cancelled"
    ) {
      const estadoEsperado =
        eventType === "charge.failed" ? "failed" : "cancelled";

      if (charge.status?.toLowerCase() !== estadoEsperado) {
        return responder({
          ok: false,
          error: "El estado del cargo no coincide con el evento.",
        }, 500);
      }

      if (movimiento.estado === "pendiente") {
        const { error } = await admin.rpc(
          "fallar_intento_recarga_openpay",
          {
            p_conductor_id: movimiento.conductor_id,
            p_order_id: charge.order_id,
          },
        );

        if (error) {
          console.error("[OPENPAY] Error registrando rechazo:", error.message);
          return responder({ ok: false }, 500);
        }
      } else if (movimiento.estado !== "fallido") {
        // No notificar un rechazo si el movimiento ya fue completado
        return responder({
          ok: true,
          ignorado: true,
          motivo: "La recarga ya tiene otro estado.",
        });
      }

      // Notificar únicamente después de confimrar el rechazo
      const notificacion = await notificarPago(
        admin,
        movimiento.conductor_id,
        charge.id,
        "recarga_fallida",
        Number(movimiento.monto),
      );

      console.info("[OPENPAY] Notificación de recarga:", notificacion);

      return responder({
        ok: true,
        estado: "fallido",
      });
    }

    return responder({ ok: true });

  } catch (error) {
    console.error("[OPENPAY WEBHOOK ERROR]", error);
    return responder({ ok: false }, 500);
  }
});
