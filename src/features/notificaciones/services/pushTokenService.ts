import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/shared/api/supabase";
import { configurarCanalesNotificacion } from "./canalesNotificaciones";
import { configurarCategoriasNotificacion } from "./configuracionNotificaciones";

type PlataformaPush = "android" | "ios";

const obtenerProjectId = (): string | null => {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
};

// Cada cuenta y dispositivo tendrá su propia referencia local
const obtenerClaveToken = (usuarioId: string): string => {
  return `altokke.push-token.${usuarioId}.${Platform.OS}`;
};

// Comprueba que la sesión actual pertenezca al usuario solicitado.
async function validarUsuarioActual(usuarioId: string): Promise<void> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.id !== usuarioId) {
    throw new Error("No se pudo validar la sesión del usuario.");
  }
}


async function guardarTokenPush(
  usuarioId: string,
  tokenPush: string
): Promise<string> {
  await validarUsuarioActual(usuarioId);

  const sistema = Platform.OS;

  if (sistema !== "android" && sistema !== "ios") {
    throw new Error("Plataforma no compatible con notificaciones push.");
  }

  const plataforma: PlataformaPush = sistema;
  
  const claveToken = obtenerClaveToken(usuarioId);

  const tokenAnterior =
    await SecureStore.getItemAsync(claveToken);

  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        usuario_id: usuarioId,
        token: tokenPush,
        plataforma,
        actualizado_en: new Date().toISOString(),
      },
      {
        onConflict: "usuario_id,token",
      }
    );

  if (error) {
    throw new Error(
      `No se pudo actualizar el dispositivo: ${error.message}`
    );
  }

  // Retiramos el token anterior si cambió.
  if (tokenAnterior && tokenAnterior !== tokenPush) {
    const { error: errorAnterior } = await supabase
      .from("push_tokens")
      .delete()
      .eq("usuario_id", usuarioId)
      .eq("token", tokenAnterior);

    if (errorAnterior) {
      console.warn(
        "No se pudo eliminar el token anterior:",
        errorAnterior.message
      );
    }
  }

  await SecureStore.setItemAsync(claveToken, tokenPush);

  return tokenPush;
}

// Registra o actualiza el Expo Push Token del dispositivo
export async function registrarTokenPush(
    usuarioId: string
): Promise<string | null> {
    if (!usuarioId) {
        throw new Error("No se identificó al usuario.");
    }

    if (Platform.OS !== "android" && Platform.OS !== "ios") {
        throw new Error(
        "Las notificaciones push están disponibles para dispositivos móviles."
        );
    }

    if (!Device.isDevice) {
        throw new Error(
        "Para registrar notificaciones push necesitas un dispositivo físico."
        );
    } 

    await validarUsuarioActual(usuarioId);

    // Inicializamos los canales y las categorías.
    await configurarCanalesNotificacion();
    await configurarCategoriasNotificacion();

    // Consultamos los permisos actuales.
    const permisosActuales =
        await Notifications.getPermissionsAsync();

    let estadoPermiso = permisosActuales.status;

    if (estadoPermiso !== "granted") {
        const permisosSolicitados =
        await Notifications.requestPermissionsAsync();

        estadoPermiso = permisosSolicitados.status;
    }

    if (estadoPermiso !== "granted") {
        return null;
    }

    // Obtenemos el Project ID de EAS.
    const projectId = obtenerProjectId();

    if (!projectId) {
        throw new Error("No se encontró el Project ID de EAS.");
    }

    // Generamos el Expo Push Token.
    const { data: tokenPush } =
        await Notifications.getExpoPushTokenAsync({
        projectId,
        });

    if (!tokenPush) {
        throw new Error("No se pudo obtener el Expo Push Token.");
    }

    return guardarTokenPush(usuarioId, tokenPush);
}

// Elimina únicamente el token del dispositivo actual, debe ejecutarse antes de cerrar la sesión de Supabase
export async function eliminarTokenPush(
  usuarioId: string
): Promise<void> {
  if (!usuarioId) return;

  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return;
  }

  await validarUsuarioActual(usuarioId);

  const claveToken = obtenerClaveToken(usuarioId);

  const tokenActual =
    await SecureStore.getItemAsync(claveToken);

  // No eliminamos los tokens de otros dispositivos.
  if (!tokenActual) return;

  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("token", tokenActual);

  if (error) {
    throw new Error(
      `No se pudo retirar el dispositivo: ${error.message}`
    );
  }

  await SecureStore.deleteItemAsync(claveToken);
}


/**
 * Actualiza el Expo Push Token cuando cambia
 * el token nativo de FCM o APNs.
 */
export async function actualizarTokenPushDesdeTokenNativo(
  usuarioId: string,
  tokenNativo: Notifications.DevicePushToken
): Promise<string> {
  if (!usuarioId) {
    throw new Error("No se identificó al usuario.");
  }

  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    throw new Error("Plataforma no compatible.");
  }

  await validarUsuarioActual(usuarioId);

  const projectId = obtenerProjectId();

  if (!projectId) {
    throw new Error("No se encontró el Project ID de EAS.");
  }

  // Convertimos el nuevo token nativo en un Expo Push Token.
  const { data: nuevoToken } =
    await Notifications.getExpoPushTokenAsync({
      projectId,
      devicePushToken: tokenNativo,
    });

  if (!nuevoToken) {
    throw new Error(
      "No se pudo obtener el nuevo Expo Push Token."
    );
  }

  return guardarTokenPush(usuarioId, nuevoToken);
}
