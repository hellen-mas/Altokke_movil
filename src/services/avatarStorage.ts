
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";

export async function subirAvatar(
  usuarioId: string,
  fotoUri: string
): Promise<string> {

  // Verificar que exista una sesión autenticada
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.id !== usuarioId) {
    throw new Error(
      "Debes iniciar sesión para subir tu fotografía."
    );
  }

  // Redimensionar y convertir la fotografía a JPEG
  const imagen = await ImageManipulator.manipulateAsync(
    fotoUri,
    [{ resize: { width: 800 } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Convertir imagen a Base64
  const base64 = await FileSystem.readAsStringAsync(
    imagen.uri,
    {
      encoding: FileSystem.EncodingType.Base64,
    }
  );

  // Ruta dentro del bucket
  const ruta = `${usuarioId}/perfil-${Date.now()}.jpg`;

  // Subir fotografía a Supabase Storage
  const { error } = await supabase.storage
    .from("avatars")
    .upload(ruta, decode(base64), {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Error al subir fotografía: ${error.message}`
    );
  }

  // Obtener URL pública
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(ruta);

  return data.publicUrl;
}
