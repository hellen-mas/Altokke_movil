import { supabase } from "@/shared/api/supabase";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

export interface OpcionesSubida {
  anchoMaximo?: number;
  calidad?: number;
  esPdf?: boolean;
}

export const storageService = {
  /**
   * Procesa y sube un archivo (imagen optimizada o PDF) a Supabase Storage
   */
  async subirArchivo(
    bucket: string,
    ruta: string,
    uri: string,
    opciones: OpcionesSubida = {}
  ): Promise<string> {
    const { anchoMaximo = 1200, calidad = 0.8, esPdf = false } = opciones;

    let uriFinal = uri;
    const contentType = esPdf ? "application/pdf" : "image/jpeg";

    if (!esPdf) {
      const imagen = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: anchoMaximo } }],
        { compress: calidad, format: ImageManipulator.SaveFormat.JPEG }
      );
      uriFinal = imagen.uri;
    }

    const info = await FileSystem.getInfoAsync(uriFinal);
    if (!info.exists) {
      throw new Error("El archivo no existe en el dispositivo.");
    }

    const base64 = await FileSystem.readAsStringAsync(uriFinal, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage
      .from(bucket)
      .upload(ruta, decode(base64), {
        contentType,
        upsert: false,
      });

    if (error) throw new Error(error.message);
    return ruta;
  },

  /**
   * Obtiene la URL pública de un recurso almacenado
   */
  obtenerUrlPublica(bucket: string, ruta: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
    return data.publicUrl;
  },
};
