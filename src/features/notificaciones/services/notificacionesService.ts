import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import Constants from "expo-constants";
import { supabase } from "@/shared/api/supabase";

// Configuración de visualización de notificaciones en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Configura los canales prioritarios de notificación en Android.
 */
export async function configurarCanalesNotificacion(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync("solicitudes_viaje", {
      name: "Solicitudes de Viaje",
      description: "Alertas prioritarias de nuevos pasajeros buscando mototaxi",
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 350, 150, 350],
      lightColor: "#047857",
      sound: "default",
      enableVibrate: true,
    });

    await Notifications.setNotificationChannelAsync("viajes_actualizaciones", {
      name: "Actualizaciones de Viaje",
      description: "Estado del viaje en curso, contraofertas y mensajes",
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#047857",
      sound: "default",
      enableVibrate: true,
    });
  } catch (error) {
    console.warn("Aviso al configurar canales de notificación Android:", error);
  }
}

/**
 * Solicita permisos de notificación push y registra el token Expo en public.push_tokens.
 * Maneja limpiamente emuladores y simuladores sin lanzar excepciones ni crashes.
 */
export async function solicitarPermisosYRegistrarPushToken(
  usuarioId: string
): Promise<string | null> {
  if (!usuarioId) return null;

  try {
    // 1. Configurar canales prioritarios en Android
    await configurarCanalesNotificacion();

    // 2. Comprobar permisos actuales
    const { status: permisoActual } = await Notifications.getPermissionsAsync();
    let permisoFinal = permisoActual;

    if (permisoActual !== "granted") {
      const { status: nuevoPermiso } =
        await Notifications.requestPermissionsAsync();
      permisoFinal = nuevoPermiso;
    }

    if (permisoFinal !== "granted") {
      console.info("Permiso de notificaciones push no concedido por el usuario.");
      return null;
    }

    // 3. Manejo limpio de emuladores sin crash
    if (!Constants.isDevice) {
      console.info("Entorno emulador detectado: push tokens físicos desactivados.");
      return null;
    }

    // 4. Obtener Expo Push Token del proyecto
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      "c8160c06-87ff-47e6-a092-6aca40801f0b";

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = pushTokenData.data;

    if (!token) return null;

    // 5. Guardar o actualizar en la tabla public.push_tokens
    const plataforma: "android" | "ios" | "web" =
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

    const { error } = await supabase.from("push_tokens").upsert(
      {
        usuario_id: usuarioId,
        token,
        plataforma,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "usuario_id,token" }
    );

    if (error) {
      console.warn("Aviso al registrar push token en Supabase:", error.message);
    }

    return token;
  } catch (error) {
    console.warn("No se pudo obtener el push token:", error);
    return null;
  }
}

/**
 * Elimina el push token actual del usuario en Supabase al cerrar sesión.
 */
export async function desregistrarPushToken(usuarioId: string): Promise<void> {
  if (!usuarioId || !Constants.isDevice) return;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      "c8160c06-87ff-47e6-a092-6aca40801f0b";

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = pushTokenData?.data;

    if (token) {
      await supabase
        .from("push_tokens")
        .delete()
        .eq("usuario_id", usuarioId)
        .eq("token", token);
    }
  } catch (error) {
    console.warn("Aviso al desregistrar push token:", error);
  }
}

export type TipoEventoPush =
  | "solicitud_viaje"
  | "contraoferta"
  | "viaje_aceptado"
  | "chat_mensaje"
  | "conductor_llegada";

export interface PayloadEventoPush {
  evento: TipoEventoPush;
  viajeId: string;
  usuarioDestinoId?: string;
  titulo?: string;
  mensaje?: string;
  datosExtra?: Record<string, unknown>;
}

/**
 * Invoca la Edge Function enviar-notificacion-push de Supabase.
 */
export async function emitirNotificacionPush(
  payload: PayloadEventoPush
): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke(
      "enviar-notificacion-push",
      {
        body: payload,
      }
    );

    if (error) {
      console.warn("Aviso al invocar Edge Function enviar-notificacion-push:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Fallo de red al enviar push notification:", error);
    return false;
  }
}

/**
 * Escucha en tiempo real los cambios de los viajes del pasajero.
 * Devuelve una función para cancelar la suscripción.
 */
export function suscribirseAViajesDelPasajero(
  pasajeroId: string,
  alCambiarEstado: (viajeId: string, estado: string) => void
): () => void {
  const canal = supabase
    .channel(`canal_notificaciones_pasajero_${pasajeroId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "viajes",
        filter: `pasajero_id=eq.${pasajeroId}`,
      },
      (payload) => {
        const viaje = payload.new as { id?: string; estado?: string | null };
        if (viaje?.id && viaje?.estado) {
          alCambiarEstado(viaje.id, viaje.estado);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
