
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import {
  enviarPushExpo,
  type ExpoPushMessage,
} from "../_shared/expoPush.ts";

type AdminClient = SupabaseClient<any, "public", any>;

interface Viaje {
  id: string;
  pasajero_id: string;
  conductor_id: string | null;
  estado: string;
  origen_texto: string;
  destino_texto: string;
}

interface EventoWebhook {
  type: "INSERT" | "UPDATE";
  table: string;
  schema: string;
  record: Viaje;
  old_record?: Viaje | null;
}

interface GrupoPush {
  usuarios: string[];
  tipo: string;
  destino: string;
  titulo: string;
  mensaje: string;
}

interface TokenPush {
  id: string;
  usuario_id: string;
  token: string;
}

const responder = (data: unknown, status = 200) =>
  Response.json(data, { status });

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

async function generarHash(evento: EventoWebhook): Promise<string> {
  const contenido = serializarCanonico(evento);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(contenido)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function obtenerConductoresDisponibles(
  admin: AdminClient,
  excluir: string[] = []
): Promise<string[]> {
  const { data, error } = await admin
    .from("conductores_perfil")
    .select("usuario_id")
    .eq("estado", "aprobado")
    .eq("en_linea", true);

  if (error) {
    throw new Error(
      `Error consultando conductores: ${error.message}`
    );
  }

  return (data ?? [])
    .map((c: { usuario_id: string }) => c.usuario_id)
    .filter((id: string) => !excluir.includes(id));
}

async function obtenerGrupos(
  admin: AdminClient,
  evento: EventoWebhook
): Promise<GrupoPush[]> {
  const viaje = evento.record;
  const anterior = evento.old_record;
  const grupos: GrupoPush[] = [];

  // Nueva solicitud: notificar a conductores disponibles.
  if (evento.type === "INSERT" && viaje.estado === "buscando") {
    const conductores = await obtenerConductoresDisponibles(admin);

    if (conductores.length > 0) {
      grupos.push({
        usuarios: conductores,
        tipo: "nueva_solicitud",
        destino: "solicitudes",
        titulo: "Nueva solicitud de viaje",
        mensaje: "Hay un pasajero esperando. Abre ALTOKKE para revisar la solicitud.",
      });
    }

    return grupos;
  }

  if (evento.type !== "UPDATE" || !anterior) {
    return grupos;
  }

  // Pasajero: viaje aceptado.
  if (
    viaje.estado === "aceptado" &&
    (anterior.estado !== "aceptado" ||
      anterior.conductor_id !== viaje.conductor_id)
  ) {
    grupos.push({
      usuarios: [viaje.pasajero_id],
      tipo: "viaje_aceptado",
      destino: "viaje-activo",
      titulo: "¡Tu viaje fue aceptado!",
      mensaje: "Un conductor aceptó tu solicitud. Ya puedes ver los detalles.",
    });
  }

  // Pasajero: conductor en camino.
  else if (
    viaje.estado === "en_camino_origen" &&
    anterior.estado !== viaje.estado
  ) {
    grupos.push({
      usuarios: [viaje.pasajero_id],
      tipo: "conductor_en_camino",
      destino: "viaje-activo",
      titulo: "Tu conductor está en camino",
      mensaje: "Tu conductor se dirige al punto de recojo.",
    });
  }

  // Pasajero: conductor llegó.
  else if (
    viaje.estado === "esperando_pasajero" &&
    anterior.estado !== viaje.estado
  ) {
    grupos.push({
      usuarios: [viaje.pasajero_id],
      tipo: "conductor_llego",
      destino: "viaje-activo",
      titulo: "¡Tu conductor llegó!",
      mensaje: "Tu mototaxi está esperando en el punto de recojo.",
    });
  }

  // Pasajero: viaje iniciado.
  else if (
    viaje.estado === "en_viaje" &&
    anterior.estado !== viaje.estado
  ) {
    grupos.push({
      usuarios: [viaje.pasajero_id],
      tipo: "viaje_iniciado",
      destino: "viaje-activo",
      titulo: "Tu viaje ha comenzado",
      mensaje: "Disfruta tu recorrido con ALTOKKE.",
    });
  }

  // Pasajero: viaje finalizado.
  else if (
    viaje.estado === "finalizado" &&
    anterior.estado !== viaje.estado
  ) {
    grupos.push({
      usuarios: [viaje.pasajero_id],
      tipo: "viaje_finalizado",
      destino: "viaje-activo",
      titulo: "Viaje finalizado",
      mensaje: "Tu recorrido ha terminado. ¡Gracias por viajar con ALTOKKE!",
    });
  }

  // Conductor: pasajero canceló.
  else if (
    viaje.estado === "cancelado_pasajero" &&
    anterior.estado !== viaje.estado
  ) {
    const conductorId = anterior.conductor_id ?? viaje.conductor_id;

    if (conductorId) {
      grupos.push({
        usuarios: [conductorId],
        tipo: "viaje_cancelado_pasajero",
        destino: "solicitudes",
        titulo: "Viaje cancelado",
        mensaje: "El pasajero canceló la solicitud.",
      });
    }
  }

  // Pasajero: cancelación directa del conductor.
  else if (
    viaje.estado === "cancelado_conductor" &&
    anterior.estado !== viaje.estado
  ) {
    grupos.push({
      usuarios: [viaje.pasajero_id],
      tipo: "viaje_cancelado_conductor",
      destino: "buscando-conductor",
      titulo: "El conductor canceló el viaje",
      mensaje: "Puedes continuar buscando otro conductor.",
    });
  }

  // El conductor libera el viaje y vuelve a la bolsa de solicitudes.
  else if (
    viaje.estado === "buscando" &&
    anterior.estado !== "buscando" &&
    anterior.conductor_id &&
    !viaje.conductor_id
  ) {
    grupos.push({
      usuarios: [viaje.pasajero_id],
      tipo: "viaje_reabierto",
      destino: "buscando-conductor",
      titulo: "Buscando otro conductor",
      mensaje: "La asignación anterior fue cancelada. Estamos buscando otro conductor.",
    });

    const conductores = await obtenerConductoresDisponibles(
      admin,
      [anterior.conductor_id]
    );

    if (conductores.length > 0) {
      grupos.push({
        usuarios: conductores,
        tipo: "nueva_solicitud",
        destino: "solicitudes",
        titulo: "Nueva solicitud disponible",
        mensaje: "Hay un viaje disponible. Abre ALTOKKE para revisarlo.",
      });
    }
  }

  return grupos;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return responder({ error: "Método no permitido" }, 405);
  }

  let finalizarEvento:
    | ((estado: "completado" | "fallido", detalle?: string) => Promise<void>)
    | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("APPROVAL_WEBHOOK_SECRET");

    if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
      throw new Error("Faltan credenciales de configuración.");
    }

    const authorizationRecibida =
      req.headers.get("Authorization") ?? "";

    const secretoRecibido =
      req.headers.get("x-webhook-secret") ?? "";

    const coincideServiceRole =
      authorizationRecibida === `Bearer ${serviceRoleKey}`;

    const coincideWebhook =
      secretoRecibido === webhookSecret;

    console.warn("DIAGNOSTICO AUTENTICACION:", {
      tieneAuthorization: Boolean(authorizationRecibida),
      coincideServiceRole,
      tieneWebhookSecret: Boolean(secretoRecibido),
      coincideWebhook,
    });

    if (!coincideWebhook) {
      return responder({ error: "No autorizado" }, 401);
    }

    const evento = await req.json() as EventoWebhook;

    if (
      evento.schema !== "public" ||
      evento.table !== "viajes" ||
      !evento.record?.id ||
      !evento.record?.pasajero_id
    ) {
      return responder({ error: "Evento inválido" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const grupos = await obtenerGrupos(admin, evento);

    if (grupos.length === 0) {
      return responder({
        ok: true,
        ignorado: true,
        mensaje: "No hay una transición que genere notificaciones.",
      });
    }

    // Idempotencia: evitar procesar dos veces el mismo evento.
    const eventHash = await generarHash(evento);

    const { data: reclamos, error: errorReclamo } =
      await admin.rpc("claim_push_webhook_event", {
        p_event_hash: eventHash,
        p_usuario_id: evento.record.pasajero_id,
        p_tipo: "evento_viaje",
      });

    if (errorReclamo) {
      throw new Error(errorReclamo.message);
    }

    const reclamo = reclamos?.[0] as
      | { event_id: string; claimed: boolean }
      | undefined;

    if (!reclamo?.event_id) {
      throw new Error("No se pudo reclamar el evento.");
    }

    if (!reclamo.claimed) {
      return responder({ ok: true, duplicado: true });
    }

    const eventId = reclamo.event_id;

    finalizarEvento = async (estado, detalle) => {
      const { error } = await admin
        .from("push_webhook_events")
        .update({
          estado,
          ultimo_error: detalle ?? null,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", eventId);

      if (error) throw new Error(error.message);
    };

    const usuarios = [
      ...new Set(grupos.flatMap((grupo) => grupo.usuarios)),
    ];

    const { data: tokens, error: errorTokens } = await admin
      .from("push_tokens")
      .select("id, usuario_id, token")
      .in("usuario_id", usuarios);

    if (errorTokens) {
      throw new Error(errorTokens.message);
    }

    const dispositivos = (tokens ?? []) as TokenPush[];

    if (dispositivos.length === 0) {
      await finalizarEvento("completado");
      finalizarEvento = null;

      return responder({
        ok: true,
        enviados: 0,
        mensaje: "No existen dispositivos registrados para los destinatarios.",
      });
    }

    const mensajes: ExpoPushMessage[] = [];

    const metadatos = new Map<
      string,
      { usuario_id: string; push_token_id: string; tipo: string }
    >();

    for (const grupo of grupos) {
      for (const dispositivo of dispositivos) {
        if (!grupo.usuarios.includes(dispositivo.usuario_id)) {
          continue;
        }

        mensajes.push({
          to: dispositivo.token,
          title: grupo.titulo,
          body: grupo.mensaje,
          sound: "altokke_viajes.wav",
          priority: "high",
          channelId: "viajes_v3",
          data: {
            categoria: "viajes",
            tipo: grupo.tipo,
            destino: grupo.destino,
            viaje_id: evento.record.id,
          },
        });

        metadatos.set(dispositivo.token, {
          usuario_id: dispositivo.usuario_id,
          push_token_id: dispositivo.id,
          tipo: grupo.tipo,
        });
      }
    }

    const resultado = await enviarPushExpo(
      mensajes,
      Deno.env.get("EXPO_ACCESS_TOKEN")
    );

    // No reenviar si Expo ya aceptó el envío.
    await finalizarEvento("completado");
    finalizarEvento = null;

    // Guardar tickets para consultar posteriormente su entrega.
    const recibos = resultado.tickets.flatMap((ticket) => {
      const meta = metadatos.get(ticket.token);

      if (ticket.status !== "ok" || !ticket.ticketId || !meta) {
        return [];
      }

      return [{
        ticket_id: ticket.ticketId,
        usuario_id: meta.usuario_id,
        push_token_id: meta.push_token_id,
        categoria: "viajes",
        tipo: meta.tipo,
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
        console.error("Error guardando recibos:", error.message);
      }
    }

    // Eliminar tokens que Expo identifica como inválidos.
    const invalidos = new Set(resultado.tokensInvalidos);

    for (const dispositivo of dispositivos) {
      if (!invalidos.has(dispositivo.token)) continue;

      const { error } = await admin
        .from("push_tokens")
        .delete()
        .eq("id", dispositivo.id);

      if (error) {
        console.warn("No se pudo eliminar un token inválido:", error.message);
      }
    }

    return responder({
      ok: true,
      viaje_id: evento.record.id,
      dispositivos: dispositivos.length,
      aceptados_por_expo: resultado.aceptadosPorExpo,
      fallidos: resultado.fallidos,
      tickets: resultado.ticketIds.length,
    });

  } catch (error) {
    const mensaje = error instanceof Error
      ? error.message
      : "Error interno";

    console.error("Error notificando evento de viaje:", error);

    if (finalizarEvento) {
      try {
        await finalizarEvento("fallido", mensaje);
      } catch (errorFinalizacion) {
        console.error("Error registrando fallo:", errorFinalizacion);
      }
    }

    return responder({ error: mensaje }, 500);
  }
});
