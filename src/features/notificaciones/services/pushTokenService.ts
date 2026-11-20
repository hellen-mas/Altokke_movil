import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "@/shared/api/supabase";

type PlataformaPush = "android" | "ios";

// Solicita permisos, obtiene el Expo Push  Token y lo registra en Supabase para el usuario autenticado
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

    // Verificamos que el usuario de la sesión sea el propietario del token 
    const {
        data: {user},
        error: errorAuth,
    } = await supabase.auth.getUser();

    if (errorAuth || !user || user.id !== usuarioId) {
        throw new Error("No se pudo validar la sesión del conductor.");
    }

    // Andorid necesita un canal para organizar las notificaciones
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
        name: "Notificaciones ALTOKKE",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#16A34A",
        });
    }

    // Consultamos los permisos actuales
    const permisosActuales = await Notifications.getPermissionsAsync();

    let estadoPermiso = permisosActuales.status;

    if (estadoPermiso !== "granted") {
        const permisosSolicitados =
        await Notifications.requestPermissionsAsync();

        estadoPermiso = permisosSolicitados.status;
    }

    if (estadoPermiso !== "granted") {
        return null;
    }

    // Obtenemos el identificador del proyecto EAS
    const projectId = 
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
        throw new Error("No se encontró el Project ID de EAS.");
    }

    // Generamos el Expo Push Token
    const { data: tokenPush } = await Notifications.getExpoPushTokenAsync({projectId});
    const plataforma: PlataformaPush = Platform.OS;

    // Registramos o actualizamos el token del dispositivo
    const { error: errorRegistro } = await supabase
        .from("push_tokens")
        .upsert(
        {
            usuario_id: user.id,
            token: tokenPush,
            plataforma,
            actualizado_en: new Date().toISOString(),
        },
        {
            onConflict: "usuario_id,token",
        }
        );
    
    if (errorRegistro) {
        throw new Error(`No se pudo registrar el dispositivo: ${errorRegistro.message}`);
    }

    return tokenPush;
}