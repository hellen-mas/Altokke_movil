
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const CATEGORIA_APROBACION_CONDUCTOR = "APROBACION_CONDUCTOR";
export const ACCION_VER_APROBACION = "VER_APROBACION";

export async function configurarCategoriasNotificacion(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(
    CATEGORIA_APROBACION_CONDUCTOR,
    [
      {
        identifier: ACCION_VER_APROBACION,
        buttonTitle: "Ver aprobación",
        options: {
          opensAppToForeground: true,
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]
  );
}