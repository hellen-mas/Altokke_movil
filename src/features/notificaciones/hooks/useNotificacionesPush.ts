
import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import { useAuth } from "@/features/autenticacion/hooks/useAuth";

import {
  registrarTokenPush,
} from "@/features/notificaciones/services/pushTokenService";

import {
  obtenerRutaNotificacion,
} from "@/features/notificaciones/services/navegacionNotificaciones";

const respuestasProcesadas = new Set<string>();

export function useNotificacionesPush() {
  const { userId, userRole, isAuthenticated } = useAuth();

  useEffect(() => {
    if (
      !isAuthenticated ||
      !userId ||
      (userRole !== "conductor" && userRole !== "pasajero")
    ) {
      return;
    }

    let activo = true;

    // Registrar el dispositivo del conductor.
    void registrarTokenPush(userId).catch((error) => {
      console.warn(
        "No se pudo registrar el dispositivo para notificaciones:",
        error
      );
    });

    // Procesar una respuesta de notificación.
    const procesarRespuesta = (
      respuesta: Notifications.NotificationResponse
    ) => {
      if (!activo) return;

      const identificador =
        respuesta.notification.request.identifier;

      if (respuestasProcesadas.has(identificador)) {
        return;
      }

      const datos =
        respuesta.notification.request.content.data;

      const ruta = obtenerRutaNotificacion(datos, userRole);

      // Ignoramos notificaciones que no pertenecen
      // a nuestro contrato de navegación.
      if (!ruta) return;

      respuestasProcesadas.add(identificador);

      // Evitamos que el conjunto crezca indefinidamente.
      if (respuestasProcesadas.size > 100) {
        const primerId =
          respuestasProcesadas.values().next().value;

        if (primerId) {
          respuestasProcesadas.delete(primerId);
        }
      }

      router.push(ruta as never);

      void Notifications.clearLastNotificationResponseAsync()
        .catch((error) => {
          console.warn(
            "No se pudo limpiar la última respuesta push:",
            error
          );
        });
    };

    // Detectar cuando el usuario pulsa una notificación.
    const respuestaSub =
      Notifications.addNotificationResponseReceivedListener(
        procesarRespuesta
      );

    // Recuperar la notificación que abrió la aplicación.
    void Notifications.getLastNotificationResponseAsync()
      .then((respuesta) => {
        if (!activo || !respuesta) return;

        procesarRespuesta(respuesta);
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
