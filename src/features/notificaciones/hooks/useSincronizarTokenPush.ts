
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { useAuth } from "@/features/autenticacion/hooks/useAuth";

import {
  actualizarTokenPushDesdeTokenNativo,
} from "@/features/notificaciones/services/pushTokenService";

export function useSincronizarTokenPush() {
  const { userId, isAuthenticated } = useAuth();

  useEffect(() => {
    if (
      !isAuthenticated ||
      !userId ||
      (Platform.OS !== "android" && Platform.OS !== "ios")
    ) {
      return;
    }

    let activo = true;
    let procesando = false;

    // Escuchamos las renovaciones del token nativo.
    const suscripcion = Notifications.addPushTokenListener(
      (tokenNativo) => {
        if (!activo || procesando) return;

        procesando = true;

        void actualizarTokenPushDesdeTokenNativo(
          userId,
          tokenNativo
        )
          .then(() => {
            console.info(
              "Expo Push Token actualizado correctamente."
            );
          })
          .catch((error) => {
            console.warn(
              "No se pudo actualizar el Expo Push Token:",
              error
            );
          })
          .finally(() => {
            procesando = false;
          });
      }
    );

    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, [isAuthenticated, userId]);
}
