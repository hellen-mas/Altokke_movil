
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface RegistroConductor {
  usuario_id: string;
  estado: string;
}

interface EventoWebhook {
  type: string;
  table: string;
  schema: string;
  record: RegistroConductor;
  old_record: RegistroConductor;
}

interface TokenPush {
  id: string;
  token: string;
}

interface TicketExpo {
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

const responder = (data: unknown, status = 200) =>
  Response.json(data, { status });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return responder({ error: "Método no permitido" }, 405);
  }

  try {
    // 1. Validar que la petición provenga del webhook autorizado.
    const secretoEsperado = Deno.env.get("APPROVAL_WEBHOOK_SECRET");
    const secretoRecibido = req.headers.get("x-webhook-secret");

    if (!secretoEsperado) {
      console.error("Falta APPROVAL_WEBHOOK_SECRET.");
      return responder({ error: "Configuración incompleta" }, 500);
    }

    if (secretoRecibido !== secretoEsperado) {
      return responder({ error: "No autorizado" }, 401);
    }

    // 2. Leer el evento de Supabase.
    const evento = await req.json() as EventoWebhook;

    if (
      evento.type !== "UPDATE" ||
      evento.table !== "conductores_perfil" ||
      evento.schema !== "public"
    ) {
      return responder({ ignorado: true, motivo: "Evento no compatible" });
    }

    const nuevo = evento.record;
    const anterior = evento.old_record;

    if (!nuevo?.usuario_id || !nuevo.estado) {
      return responder({ error: "Datos del conductor incompletos" }, 400);
    }

    // 3. Solo notificar una transición hacia aprobado.
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

    // 4. Crear cliente administrativo exclusivamente en servidor.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Faltan las credenciales de Supabase.");
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // 5. Obtener los dispositivos del conductor.
    const { data: tokens, error: errorTokens } = await supabaseAdmin
      .from("push_tokens")
      .select("id, token")
      .eq("usuario_id", nuevo.usuario_id);

    if (errorTokens) {
      throw new Error(
        `Error consultando tokens: ${errorTokens.message}`
      );
    }

    if (!tokens?.length) {
      return responder({
        ok: true,
        enviados: 0,
        motivo: "El conductor no tiene dispositivos registrados",
      });
    }

    // 6. Preparar los mensajes para Expo Push API.
    const mensajes = (tokens as TokenPush[]).map((dispositivo) => ({
      to: dispositivo.token,
      title: "¡Tu solicitud fue aprobada!",
      body: "Tu cuenta de conductor ya está habilitada. Ya puedes comenzar a recibir viajes.",
      sound: "default",
      priority: "high",
      channelId: "default",
      data: {
        tipo: "solicitud_aprobada",
        ruta: "/(auth)/estado-solicitud",
      },
    }));

    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (expoAccessToken) {
      headers.Authorization = `Bearer ${expoAccessToken}`;
    }

    let enviados = 0;
    let fallidos = 0;
    const tokensInvalidos: string[] = [];

    // 7. Enviar en grupos de máximo 100 mensajes.
    for (let i = 0; i < mensajes.length; i += 100) {
      const lote = mensajes.slice(i, i + 100);
      const respuestaExpo = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers,
          body: JSON.stringify(lote),
        }
      );

      if (!respuestaExpo.ok) {
        const detalle = await respuestaExpo.text();

        console.error("Error de Expo Push:", detalle);

        throw new Error("Expo no pudo procesar el envío.");
      }

      const resultado = await respuestaExpo.json() as {
        data?: TicketExpo[];
      };

      const tickets = resultado.data ?? [];

      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          enviados++;
          return;
        }

        fallidos++;

        if (ticket.details?.error === "DeviceNotRegistered") {
          tokensInvalidos.push(lote[index].to);
        }

        console.warn("Error en ticket Expo:", ticket.message);
      });
    }

    // 8. Limpiar tokens que ya no pertenecen a dispositivos activos.
    for (const token of tokensInvalidos) {
      await supabaseAdmin
        .from("push_tokens")
        .delete()
        .eq("usuario_id", nuevo.usuario_id)
        .eq("token", token);
    }

    return responder({
      ok: true,
      conductor_id: nuevo.usuario_id,
      dispositivos: tokens.length,
      enviados,
      fallidos,
      tokens_eliminados: tokensInvalidos.length,
    });
  } catch (error: unknown) {
    console.error("Error en notificar-aprobacion-conductor:", error);

    return responder(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor",
      },
      500
    );
  }
});
