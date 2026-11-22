
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import {
  enviarPushExpo,
  type ExpoPushMessage,
} from "../_shared/expoPush.ts";

interface RegistroConductor {
  usuario_id: string;
  estado: string;
}

interface EventoWebhook {
  type: string;
  table: string;
  schema: string;
  record: RegistroConductor;
  old_record?: RegistroConductor | null;
}

interface TokenPush {
  id: string;
  token: string;
}

type EstadoEvento = "procesando" | "completado" | "fallido";

const responder = (data: unknown, status = 200) =>
  Response.json(data, { status });

// Serialización estable para identificar eventos repetidos.
function serializarCanonico(valor: unknown): string {
  if (valor === null || typeof valor !== "object") {
    return JSON.stringify(valor) ?? "null";
  }

  if (Array.isArray(valor)) {
    return `[${valor.map(serializarCanonico).join(",")}]`;
  }

  const objeto = valor as Record<string, unknown>;

  return `{${Object.keys(objeto)
    .sort()
    .map(
      (clave) =>
        `${JSON.stringify(clave)}:${serializarCanonico(objeto[clave])}`
    )
    .join(",")}}`;
}

async function generarHashEvento(evento: EventoWebhook): Promise<string> {
  const contenido = serializarCanonico(evento);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(contenido)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return responder({ error: "Método no permitido" }, 405);
  }

  let finalizarEvento:
    | ((estado: EstadoEvento, detalle?: string) => Promise<void>)
    | null = null;

  try {
    // 1. Validar el webhook.
    const secretoEsperado = Deno.env.get("APPROVAL_WEBHOOK_SECRET");
    const secretoRecibido = req.headers.get("x-webhook-secret");

    if (!secretoEsperado) {
      console.error("Falta APPROVAL_WEBHOOK_SECRET.");
      return responder({ error: "Configuración incompleta" }, 500);
    }

    if (secretoRecibido !== secretoEsperado) {
      return responder({ error: "No autorizado" }, 401);
    }

    // 2. Validar el evento.
    const evento = await req.json() as EventoWebhook;

    if (
      evento.type !== "UPDATE" ||
      evento.table !== "conductores_perfil" ||
      evento.schema !== "public"
    ) {
      return responder({
        ignorado: true,
        motivo: "Evento no compatible",
      });
    }

    const nuevo = evento.record;
    const anterior = evento.old_record;

    if (!nuevo?.usuario_id || !nuevo.estado) {
      return responder({
        error: "Datos del conductor incompletos",
      }, 400);
    }

    // 3. Solo procesar una transición hacia aprobado.
    if (
      nuevo.estado !== "aprobado" ||
      anterior?.estado === "aprobado"
    ) {
      return responder({
        ok: true,
        ignorado: true,
        motivo: "No hubo una nueva aprobación",
      });
    }

    // 4. Crear cliente administrativo.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Faltan las credenciales de Supabase.");
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // 5. Reclamar el evento antes de enviar.
    const eventHash = await generarHashEvento(evento);

    const { data: reclamos, error: errorReclamo } =
      await supabaseAdmin.rpc("claim_push_webhook_event", {
        p_event_hash: eventHash,
        p_usuario_id: nuevo.usuario_id,
        p_tipo: "solicitud_aprobada",
      });

    if (errorReclamo) {
      throw new Error(
        `No se pudo registrar el evento: ${errorReclamo.message}`
      );
    }

    const reclamo = reclamos?.[0] as
      | { event_id: string; claimed: boolean }
      | undefined;

    if (!reclamo?.event_id) {
      throw new Error("No se pudo obtener el registro del evento.");
    }

    // Si ya se procesó o está siendo procesado, no reenviar.
    if (!reclamo.claimed) {
      return responder({
        ok: true,
        duplicado: true,
        mensaje: "Este evento ya fue procesado o está en ejecución.",
      });
    }

    const eventId = reclamo.event_id;

    // Permite registrar el resultado del procesamiento.
    finalizarEvento = async (estado, detalle) => {
      const { error } = await supabaseAdmin
        .from("push_webhook_events")
        .update({
          estado,
          ultimo_error: detalle ?? null,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", eventId);

      if (error) {
        throw new Error(
          `No se pudo actualizar el evento: ${error.message}`
        );
      }
    };

    // 6. Obtener dispositivos del conductor.
    const { data: tokens, error: errorTokens } =
      await supabaseAdmin
        .from("push_tokens")
        .select("id, token")
        .eq("usuario_id", nuevo.usuario_id);

    if (errorTokens) {
      throw new Error(
        `Error consultando dispositivos: ${errorTokens.message}`
      );
    }

    const dispositivos = (tokens ?? []) as TokenPush[];

    if (dispositivos.length === 0) {
      await finalizarEvento("completado");
      finalizarEvento = null;

      return responder({
        ok: true,
        enviados: 0,
        motivo: "El conductor no tiene dispositivos registrados",
      });
    }

    // 7. Preparar notificaciones.
    const mensajes: ExpoPushMessage[] = dispositivos.map(
      (dispositivo) => ({
        to: dispositivo.token,
        title: "¡Tu solicitud fue aprobada!",
        body: "Tu cuenta de conductor ya está habilitada. Ya puedes comenzar a recibir viajes.",
        sound: "altokke_aprobacion.wav",
        priority: "high",
        channelId: "aprobaciones_v2",
        data: {
          categoria: "cuenta",
          tipo: "solicitud_aprobada",
          ruta: "/(auth)/estado-solicitud",
        },
      })
    );

    // 8. Enviar mediante Expo.
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

    const resultadoPush = await enviarPushExpo(
      mensajes,
      expoAccessToken
    );

    // El envío ya se realizó. No repetirlo si falla un paso posterior.
    await finalizarEvento("completado");
    finalizarEvento = null;

    // 9. Eliminar dispositivos inválidos.
    for (const tokenInvalido of resultadoPush.tokensInvalidos) {
      const { error } = await supabaseAdmin
        .from("push_tokens")
        .delete()
        .eq("usuario_id", nuevo.usuario_id)
        .eq("token", tokenInvalido);

      if (error) {
        console.warn(
          "No se pudo eliminar un dispositivo inválido:",
          error.message
        );
      }
    }

    // 10. Preparar recibos.
    const dispositivosPorToken = new Map(
      dispositivos.map((dispositivo) => [
        dispositivo.token,
        dispositivo,
      ])
    );

    const recibosPendientes = resultadoPush.tickets.flatMap(
      (ticket) => {
        if (ticket.status !== "ok" || !ticket.ticketId) {
          return [];
        }

        const dispositivo = dispositivosPorToken.get(ticket.token);

        if (!dispositivo) return [];

        return [{
          ticket_id: ticket.ticketId,
          usuario_id: nuevo.usuario_id,
          push_token_id: dispositivo.id,
          categoria: "cuenta",
          tipo: "solicitud_aprobada",
          estado: "pendiente",
        }];
      }
    );

    // 11. Guardar recibos sin duplicar tickets.
    let recibosRegistrados = 0;
    let errorRegistroRecibos: string | null = null;

    if (recibosPendientes.length > 0) {
      const { data: insertados, error } = await supabaseAdmin
        .from("push_receipts")
        .upsert(recibosPendientes, {
          onConflict: "ticket_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        errorRegistroRecibos = error.message;

        console.error(
          "Error guardando recibos:",
          error.message
        );
      } else {
        recibosRegistrados = insertados?.length ?? 0;
      }
    }

    // 12. Responder.
    return responder({
      ok: true,
      conductor_id: nuevo.usuario_id,
      dispositivos: dispositivos.length,
      aceptados_por_expo: resultadoPush.aceptadosPorExpo,
      fallidos: resultadoPush.fallidos,
      tickets_generados: resultadoPush.ticketIds.length,
      recibos_registrados: recibosRegistrados,
      tokens_eliminados: resultadoPush.tokensInvalidos.length,
      error_registro_recibos: errorRegistroRecibos,
    });

  } catch (error: unknown) {
    const mensaje = error instanceof Error
      ? error.message
      : "Error interno del servidor";

    console.error(
      "Error en notificar-aprobacion-conductor:",
      error
    );

    // Registrar el fallo para permitir un reintento controlado.
    if (finalizarEvento) {
      try {
        await finalizarEvento("fallido", mensaje);
      } catch (errorFinalizacion) {
        console.error(
          "No se pudo actualizar el estado del evento:",
          errorFinalizacion
        );
      }
    }

    return responder({ error: mensaje }, 500);
  }
});

