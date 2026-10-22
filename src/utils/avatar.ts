import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";

export interface ResultadoAvatar {
  ok: boolean;
  url?: string;
  error?: string;
}

export interface InfoFotoSeleccionada {
  uri: string;
  base64?: string;
}

/**
 * Abre el selector de imágenes de Expo para elegir y recortar una foto de perfil en formato cuadrado (1:1).
 * Comprime y redimensiona localmente a 400x400 JPEG para optimizar la velocidad en conexiones 3G/lentas.
 */
export async function seleccionarFotoGaleria(): Promise<InfoFotoSeleccionada | null> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    throw new Error("Se requiere permiso para acceder a la galería de fotos.");
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (resultado.canceled || !resultado.assets?.[0]?.uri) {
    return null;
  }

  // Redimensionamos a 400x400 y comprimimos al 70% en el celular.
  // Esto reduce fotos de 10 MB a ~50 KB, permitiendo subidas instantáneas incluso en 3G.
  const optimizada = await manipulateAsync(
    resultado.assets[0].uri,
    [{ resize: { width: 400, height: 400 } }],
    { compress: 0.7, format: SaveFormat.JPEG, base64: true }
  );

  return {
    uri: optimizada.uri,
    base64: optimizada.base64 || undefined,
  };
}

/**
 * Valida una imagen con Sightengine a través de la Edge Function en modo 'validateOnly'
 * antes de registrar al usuario, permitiendo detectar desnudez, armas o drogas de inmediato.
 */
export async function validarFotoModeracion(
  uriOrInfo: string | InfoFotoSeleccionada,
  base64Param?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const uri = typeof uriOrInfo === "string" ? uriOrInfo : uriOrInfo.uri;
    const base64 = typeof uriOrInfo === "string" ? base64Param : (uriOrInfo.base64 || base64Param);

    let bodyPayload: any;
    const nombreArchivo = uri.split("/").pop() || `avatar_${Date.now()}.jpg`;
    const extension = nombreArchivo.split(".").pop()?.toLowerCase();
    const mimeType = extension === "png" ? "image/png" : "image/jpeg";

    if (base64) {
      bodyPayload = {
        validateOnly: true,
        base64,
        mimeType,
      };
    } else {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: nombreArchivo,
        type: mimeType,
      } as any);
      formData.append("validateOnly", "true");
      bodyPayload = formData;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("La verificación de la imagen tardó más de lo esperado. Verifica tu conexión a internet.")),
        15000
      )
    );

    const { data, error } = await Promise.race([
      supabase.functions.invoke("upload-avatar", {
        body: bodyPayload,
      }),
      timeoutPromise,
    ]);

    if (error) {
      let mensajeError = "La foto no cumple con las políticas de contenido permitido.";
      try {
        if (error.context && typeof error.context.json === "function") {
          const cuerpo = await error.context.json();
          if (cuerpo?.error) {
            mensajeError = cuerpo.error;
          }
        }
      } catch {
        // En caso de que el context no sea JSON legible
      }
      return { ok: false, error: mensajeError };
    }

    if (data?.error) {
      return { ok: false, error: data.error };
    }

    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Ocurrió un error al verificar el contenido de la imagen.",
    };
  }
}

/**
 * Envía una imagen local a la Edge Function `upload-avatar` de Supabase,
 * donde se valida el contenido con Sightengine y se guarda en Supabase Storage y DB.
 * Soporta tanto base64 como FormData para máxima compatibilidad.
 */
export async function subirFotoAvatar(
  uriOrInfo: string | InfoFotoSeleccionada,
  userId: string,
  base64Param?: string
): Promise<ResultadoAvatar> {
  try {
    const uri = typeof uriOrInfo === "string" ? uriOrInfo : uriOrInfo.uri;
    const base64 = typeof uriOrInfo === "string" ? base64Param : (uriOrInfo.base64 || base64Param);

    let bodyPayload: any;

    const nombreArchivo = uri.split("/").pop() || `avatar_${Date.now()}.jpg`;
    const extension = nombreArchivo.split(".").pop()?.toLowerCase();
    const mimeType = extension === "png" ? "image/png" : "image/jpeg";

    if (base64) {
      bodyPayload = {
        userId,
        base64,
        mimeType,
      };
    } else {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: nombreArchivo,
        type: mimeType,
      } as any);
      formData.append("userId", userId);
      bodyPayload = formData;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("La subida tardó más de lo esperado. Por favor verifica tu conexión a internet.")),
        15000
      )
    );

    const { data, error } = await Promise.race([
      supabase.functions.invoke("upload-avatar", {
        body: bodyPayload,
      }),
      timeoutPromise,
    ]);

    if (error) {
      let mensajeError = error.message || "Fallo en la subida o imagen rechazada.";
      try {
        if (error.context && typeof error.context.json === "function") {
          const cuerpo = await error.context.json();
          if (cuerpo?.error) {
            mensajeError = cuerpo.error;
          }
        }
      } catch {
        // En caso de que el context no contenga JSON
      }
      return { ok: false, error: mensajeError };
    }

    if (data?.error) {
      return { ok: false, error: data.error };
    }

    return { ok: true, url: data?.url };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Ocurrió un error inesperado al procesar la foto de perfil.",
    };
  }
}

/**
 * Función combinada para seleccionar y subir la foto directamente a la Edge Function
 * utilizando el userId real del usuario que ha iniciado sesión.
 */
export async function seleccionarYSubirFoto(userId: string): Promise<ResultadoAvatar | null> {
  const foto = await seleccionarFotoGaleria();
  if (!foto) return null;

  return await subirFotoAvatar(foto, userId);
}
