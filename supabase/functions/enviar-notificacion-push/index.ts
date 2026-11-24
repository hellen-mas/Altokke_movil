// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respuestaJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: corsHeaders });

interface MensajeExpoPush {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  sound?: string;
  priority?: "default" | "normal" | "high";
}

async function enviarLoteExpoPush(mensajes: MensajeExpoPush[]): Promise<any> {
  if (mensajes.length === 0) return { enviadas: 0 };

  const respuesta = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(mensajes),
  });

  return await respuesta.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return respuestaJson({ error: "Método no permitido." }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return respuestaJson({ error: "No autorizado." }, 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceRoleKey) {
      throw new Error("Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.");
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const isServiceRole = token === serviceRoleKey;
    let authenticatedUserId: string | null = null;

    if (!isServiceRole) {
      const { data: userData, error: userError } = await admin.auth.getUser(token);
      if (userError || !userData?.user) {
        return respuestaJson({ error: "Token de sesión inválido o expirado." }, 401);
      }
      authenticatedUserId = userData.user.id;
    }

    const body = await req.json().catch(() => ({}));
    const { evento, viajeId, usuarioDestinoId, titulo, mensaje, datosExtra } = body;

    if (!evento) {
      return respuestaJson({ error: "Falta el campo 'evento'." }, 400);
    }

    const mensajesAEnviar: MensajeExpoPush[] = [];

    // CASO 1: Pasajero solicita viaje -> Notificar a conductores en línea y aprobados
    if (evento === "solicitud_viaje") {
      if (!viajeId) {
        return respuestaJson({ error: "Falta viajeId para solicitud_viaje." }, 400);
      }

      // Obtener datos del viaje
      const { data: viaje, error: errViaje } = await admin
        .from("viajes")
        .select("id, pasajero_id, origen_texto, destino_texto, tarifa_estimada, origen_lat, origen_lng")
        .eq("id", viajeId)
        .maybeSingle();

      if (errViaje || !viaje) {
        return respuestaJson({ error: "Viaje no encontrado." }, 404);
      }

      // Validar que el remitente sea el pasajero titular del viaje (o service_role)
      if (!isServiceRole && viaje.pasajero_id !== authenticatedUserId) {
        return respuestaJson({ error: "No autorizado para notificar sobre este viaje." }, 403);
      }

      // Consultar conductores aprobados y en línea
      const { data: conductores, error: errCond } = await admin
        .from("conductores_perfil")
        .select("usuario_id")
        .eq("en_linea", true)
        .eq("estado", "aprobado");

      if (errCond || !conductores || conductores.length === 0) {
        return respuestaJson({ ok: true, mensaje: "No hay conductores en línea disponibles.", enviados: 0 });
      }

      const idsConductores = conductores.map((c) => c.usuario_id);

      // Obtener tokens de push de los conductores
      const { data: tokens, error: errTokens } = await admin
        .from("push_tokens")
        .select("token")
        .in("usuario_id", idsConductores);

      if (errTokens || !tokens || tokens.length === 0) {
        return respuestaJson({ ok: true, mensaje: "Conductores en línea sin push tokens registrados.", enviados: 0 });
      }

      const tarifaTexto = viaje.tarifa_estimada != null ? `S/ ${Number(viaje.tarifa_estimada).toFixed(2)}` : "Tarifa a convenir";

      for (const t of tokens) {
        mensajesAEnviar.push({
          to: t.token,
          title: "¡Nueva solicitud de mototaxi!",
          body: `${viaje.origen_texto} ➔ ${viaje.destino_texto} (${tarifaTexto})`,
          channelId: "solicitudes_viaje",
          sound: "default",
          priority: "high",
          data: {
            tipo: "solicitud_viaje",
            viajeId: viaje.id,
            ...datosExtra,
          },
        });
      }
    }

    // CASO 2: Conductor envía contraoferta o acepta el viaje -> Notificar al pasajero
    else if (evento === "contraoferta" || evento === "viaje_aceptado") {
      if (!viajeId) {
        return respuestaJson({ error: `Falta viajeId para ${evento}.` }, 400);
      }

      const { data: viaje, error: errViaje } = await admin
        .from("viajes")
        .select("id, pasajero_id, conductor_id, estado")
        .eq("id", viajeId)
        .maybeSingle();

      if (errViaje || !viaje) {
        return respuestaJson({ error: "Viaje no encontrado." }, 404);
      }

      // Validar legitimidad del conductor remitente
      if (!isServiceRole) {
        const { data: conductorPerfil } = await admin
          .from("conductores_perfil")
          .select("estado")
          .eq("usuario_id", authenticatedUserId)
          .maybeSingle();

        if (!conductorPerfil || conductorPerfil.estado !== "aprobado") {
          return respuestaJson({ error: "Solo conductores aprobados pueden emitir ofertas o asignaciones." }, 403);
        }

        if (evento === "viaje_aceptado" && viaje.conductor_id !== authenticatedUserId) {
          return respuestaJson({ error: "No estás asignado como conductor de este viaje." }, 403);
        }

        if (evento === "contraoferta" && !["buscando", "solicitado"].includes(viaje.estado)) {
          return respuestaJson({ error: "El viaje no está disponible para contraofertas." }, 400);
        }
      }

      const destinoId = viaje.pasajero_id;

      if (!destinoId) {
        return respuestaJson({ error: "No se identificó el pasajero a notificar." }, 400);
      }

      // Si el cliente especificó un usuarioDestinoId diferente al pasajero legítimo, rechazar
      if (usuarioDestinoId && usuarioDestinoId !== destinoId) {
        return respuestaJson({ error: "El destinatario no coincide con el pasajero del viaje." }, 403);
      }

      const { data: tokens } = await admin
        .from("push_tokens")
        .select("token")
        .eq("usuario_id", destinoId);

      const tituloNotif =
        titulo ||
        (evento === "viaje_aceptado"
          ? "¡Conductor asignado!"
          : "¡Nueva contraoferta recibida!");

      const cuerpoNotif =
        mensaje ||
        (evento === "viaje_aceptado"
          ? "Un conductor aceptó tu solicitud y va en camino a recogerte."
          : "Un conductor te ha propuesto una nueva tarifa para tu viaje.");

      for (const t of tokens || []) {
        mensajesAEnviar.push({
          to: t.token,
          title: tituloNotif,
          body: cuerpoNotif,
          channelId: "viajes_actualizaciones",
          sound: "default",
          priority: "high",
          data: {
            tipo: evento,
            viajeId,
            ...datosExtra,
          },
        });
      }
    }

    // CASO 3: Mensaje de chat o conductor marca llegada al punto de encuentro
    else if (evento === "chat_mensaje" || evento === "conductor_llegada") {
      if (!viajeId) {
        return respuestaJson({ error: `Falta viajeId para ${evento}.` }, 400);
      }

      const { data: viaje, error: errViaje } = await admin
        .from("viajes")
        .select("id, pasajero_id, conductor_id, estado")
        .eq("id", viajeId)
        .maybeSingle();

      if (errViaje || !viaje) {
        return respuestaJson({ error: "Viaje no encontrado." }, 404);
      }

      let destinoId: string | null = null;

      if (evento === "conductor_llegada") {
        if (!isServiceRole && viaje.conductor_id !== authenticatedUserId) {
          return respuestaJson({ error: "No eres el conductor de este viaje." }, 403);
        }
        destinoId = viaje.pasajero_id;
      } else if (evento === "chat_mensaje") {
        if (!isServiceRole) {
          const esPasajero = viaje.pasajero_id === authenticatedUserId;
          const esConductor = viaje.conductor_id === authenticatedUserId;

          if (!esPasajero && !esConductor) {
            return respuestaJson({ error: "No tienes autorización para enviar mensajes en este viaje." }, 403);
          }

          destinoId = esPasajero ? viaje.conductor_id : viaje.pasajero_id;
        } else {
          destinoId = usuarioDestinoId || (viaje.conductor_id ? viaje.conductor_id : viaje.pasajero_id);
        }
      }

      if (!destinoId) {
        return respuestaJson({ error: "Destinatario no especificado o sin contraparte en el viaje." }, 400);
      }

      if (usuarioDestinoId && usuarioDestinoId !== destinoId) {
        return respuestaJson({ error: "Destinatario no coincide con la contraparte del viaje." }, 403);
      }

      const { data: tokens } = await admin
        .from("push_tokens")
        .select("token")
        .eq("usuario_id", destinoId);

      const tituloNotif =
        titulo ||
        (evento === "conductor_llegada"
          ? "¡Tu mototaxi ha llegado!"
          : "Nuevo mensaje de viaje");

      const cuerpoNotif =
        mensaje ||
        (evento === "conductor_llegada"
          ? "El conductor te está esperando en el punto de encuentro."
          : "Tienes un mensaje nuevo.");

      for (const t of tokens || []) {
        mensajesAEnviar.push({
          to: t.token,
          title: tituloNotif,
          body: cuerpoNotif,
          channelId: "viajes_actualizaciones",
          sound: "default",
          priority: "high",
          data: {
            tipo: evento,
            viajeId,
            ...datosExtra,
          },
        });
      }
    } else {
      // Cualquier otro evento no autorizado explícitamente se rechaza
      return respuestaJson({ error: `Evento '${evento}' no reconocido o no autorizado.` }, 403);
    }

    // Enviar mensajes acumulados a Expo Push
    const resultado = await enviarLoteExpoPush(mensajesAEnviar);

    return respuestaJson({
      ok: true,
      evento,
      notificacionesEnviadas: mensajesAEnviar.length,
      resultadoExpo: resultado,
    });
  } catch (err: any) {
    console.error("Error procesando notificación push:", err);
    return respuestaJson({ error: err.message || "Error interno del servidor." }, 500);
  }
});
