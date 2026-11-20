
import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { registrarTokenPush } from "@/features/notificaciones/services/pushTokenService";

const RUTA_APROBACION = "/(auth)/estado-solicitud" as const;

const TIPO_NOTIFICACION = "solicitud_aprobada";

const respuestasProcesadas = new Set<string>();

export function useNotificacionAprobacionConductor() {
  const { userId, userRole, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || userRole !== "conductor" || !userId) {
      return;
    }

    let activo = true;

    // Registrar el dispositivo para recibir notificaciones.
    void registrarTokenPush(userId).catch((error) => {
      console.warn(
        "No se pudo registrar el token push del conductor:",
        error
      );
    });

    // Procesar cuando el conductor pulsa una notificación.
    const respuestaSub =
      Notifications.addNotificationResponseReceivedListener(
        (respuesta) => {
          const identificador =
            respuesta.notification.request.identifier;

          const datos =
            respuesta.notification.request.content.data;

          if (datos?.tipo !== TIPO_NOTIFICACION) return;

          if (respuestasProcesadas.has(identificador)) return;

          respuestasProcesadas.add(identificador);

          router.push(RUTA_APROBACION);

          void Notifications.clearLastNotificationResponseAsync();
        }
      );

    // Recuperar la notificación que abrió la aplicación.
    void Notifications.getLastNotificationResponseAsync()
      .then((respuesta) => {
        if (!activo || !respuesta) return;

        const identificador =
          respuesta.notification.request.identifier;

        const datos =
          respuesta.notification.request.content.data;

        if (datos?.tipo !== TIPO_NOTIFICACION) return;

        if (respuestasProcesadas.has(identificador)) return;

        respuestasProcesadas.add(identificador);

        router.push(RUTA_APROBACION);

        void Notifications.clearLastNotificationResponseAsync();
      })
      .catch((error) => {
        console.warn(
          "No se pudo recuperar la última notificación:",
          error
        );
      });

    return () => {
      activo = false;
      respuestaSub.remove();
    };
  }, [isAuthenticated, userRole, userId]);
}
