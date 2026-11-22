
export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound?: string;
  priority?: "default" | "normal" | "high";
  channelId?: string;
  categoryId?: string;
  threadId?: string;
  data?: Record<string, unknown>;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

// Resultado individual asociado al dispositivo destinatario.
export interface ExpoPushTicketResult {
  token: string;
  status: "ok" | "error";
  ticketId?: string;
  message?: string;
  error?: string;
}

export interface ResultadoEnvioPush {
  aceptadosPorExpo: number;
  fallidos: number;
  ticketIds: string[];
  tokensInvalidos: string[];
  tickets: ExpoPushTicketResult[];
}

const EXPO_PUSH_URL =
  "https://exp.host/--/api/v2/push/send";

const TAMANO_LOTE = 100;

// Envía notificaciones mediante Expo Push Service.
// Conserva la relación entre cada ticket y su dispositivo.
export async function enviarPushExpo(
  mensajes: ExpoPushMessage[],
  accessToken?: string
): Promise<ResultadoEnvioPush> {
  const resultado: ResultadoEnvioPush = {
    aceptadosPorExpo: 0,
    fallidos: 0,
    ticketIds: [],
    tokensInvalidos: [],
    tickets: [],
  };

  if (mensajes.length === 0) {
    return resultado;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  for (
    let inicio = 0;
    inicio < mensajes.length;
    inicio += TAMANO_LOTE
  ) {
    const lote = mensajes.slice(
      inicio,
      inicio + TAMANO_LOTE
    );

    const respuesta = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(lote),
    });

    const contenido = await respuesta.text();

    if (!respuesta.ok) {
      throw new Error(
        `Expo Push respondió con HTTP ${respuesta.status}: ${contenido.slice(0, 500)}`
      );
    }

    let respuestaJson: {
      data?: ExpoPushTicket[];
    };

    try {
      respuestaJson = JSON.parse(contenido);
    } catch {
      throw new Error(
        "Expo Push devolvió una respuesta JSON inválida."
      );
    }

    if (
      !Array.isArray(respuestaJson.data) ||
      respuestaJson.data.length !== lote.length
    ) {
      throw new Error(
        "Expo Push devolvió una cantidad de tickets diferente a los mensajes enviados."
      );
    }

    lote.forEach((mensaje, indice) => {
      const ticket = respuestaJson.data![indice];

      if (ticket.status !== "ok") {
        resultado.fallidos++;

        const codigoError = ticket.details?.error;

        resultado.tickets.push({
          token: mensaje.to,
          status: "error",
          message: ticket.message,
          error: codigoError,
        });

        if (codigoError === "DeviceNotRegistered") {
          resultado.tokensInvalidos.push(mensaje.to);
        }

        console.warn(
          "Notificación rechazada por Expo:",
          codigoError ?? ticket.message ?? "Sin detalle"
        );

        return;
      }

      resultado.aceptadosPorExpo++;

      resultado.tickets.push({
        token: mensaje.to,
        status: "ok",
        ticketId: ticket.id,
      });

      if (ticket.id) {
        resultado.ticketIds.push(ticket.id);
      } else {
        console.warn(
          "Expo aceptó una notificación sin devolver un ticket ID."
        );
      }
    });
  }

  return resultado;
}
