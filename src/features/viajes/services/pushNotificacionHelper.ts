import { supabase } from "@/shared/api/supabase";

export interface PayloadPushViaje {
  evento: "solicitud_viaje" | "contraoferta" | "viaje_aceptado" | "conductor_llegada" | "chat_mensaje";
  viajeId: string;
  usuarioDestinoId?: string;
  titulo?: string;
  mensaje?: string;
  datosExtra?: Record<string, unknown>;
}

/**
 * Invoca la Edge Function 'enviar-notificacion-push' de manera no bloqueante.
 * Un fallo temporal en el servicio de notificaciones push nunca interrumpe
 * ni bloquea la experiencia del viaje en curso.
 */
export function notificarEventoPush(payload: PayloadPushViaje): void {
  try {
    supabase.functions
      .invoke("enviar-notificacion-push", {
        body: payload,
      })
      .then(({ data, error }) => {
        if (error) {
          console.warn(
            `[PUSH DIAGNOSTICO] Error no bloqueante enviando push (${payload.evento}):`,
            error.message
          );
        } else if (data && !data.ok) {
          console.warn(
            `[PUSH DIAGNOSTICO] Advertencia del gateway push (${payload.evento}):`,
            data.error || data.mensaje
          );
        }
      })
      .catch((err: unknown) => {
        console.warn(
          `[PUSH DIAGNOSTICO] Fallo de red no bloqueante enviando push (${payload.evento}):`,
          err instanceof Error ? err.message : String(err)
        );
      });
  } catch (errSync: unknown) {
    console.warn(
      `[PUSH DIAGNOSTICO] Excepción síncrona no bloqueante enviando push (${payload.evento}):`,
      errSync instanceof Error ? errSync.message : String(errSync)
    );
  }
}
