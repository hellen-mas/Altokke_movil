import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { invocarEdgeFunction } from "@/shared/api/supabase";

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
 * Selector y optimizador de foto de perfil (1:1, 400x400 JPEG, calidad 70%)
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
 * Valida la moderación de contenido de la foto con Sightengine vía Edge Function
 */
export async function validarFotoModeracion(
  uriOrInfo: string | InfoFotoSeleccionada,
  base64Param?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const base64 = typeof uriOrInfo === "string" ? base64Param : (uriOrInfo.base64 || base64Param);
    await invocarEdgeFunction("upload-avatar", {
      validateOnly: true,
      base64,
      mimeType: "image/jpeg",
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "La foto no cumple con las políticas de contenido." };
  }
}

/**
 * Sube y valida la foto de perfil en Supabase Storage mediante Edge Function
 */
export async function subirFotoAvatar(
  uriOrInfo: string | InfoFotoSeleccionada,
  userId: string,
  base64Param?: string
): Promise<ResultadoAvatar> {
  try {
    const base64 = typeof uriOrInfo === "string" ? base64Param : (uriOrInfo.base64 || base64Param);
    const data = await invocarEdgeFunction<{ avatarUrl: string }>("upload-avatar", {
      userId,
      base64,
      mimeType: "image/jpeg",
    });
    return { ok: true, url: data.avatarUrl };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al subir foto de perfil." };
  }
}
