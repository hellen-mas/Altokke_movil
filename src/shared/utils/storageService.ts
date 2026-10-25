import { supabase } from "@/shared/api/supabase";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

export type TipoDocumento =
  | "DNI_FRONTAL"
  | "DNI_POSTERIOR"
  | "SELFIE"
  | "LICENCIA"
  | "SOAT"
  | "ANTECEDENTES";

export interface ArchivoSubida {
  uri: string;
  nombre?: string;
  tipo?: string;
}

export interface OpcionesSubida {
  anchoMaximo?: number;
  calidad?: number;
  esPdf?: boolean;
}

export interface DocumentoParaSubir {
  tipo: TipoDocumento;
  adjunto: ArchivoSubida | string;
}

export interface RegistroDocumentoSubido {
  usuario_id: string;
  tipo: TipoDocumento;
  url_archivo: string;
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
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    return ruta;
  },

  /**
   * Procesa, sube en paralelo y registra un lote de documentos en Storage y base de datos
   */
  async subirLoteDocumentos(
    usuarioId: string,
    documentos: DocumentoParaSubir[],
    bucket = "documentos-conductores"
  ): Promise<RegistroDocumentoSubido[]> {
    const documentosValidos = documentos.filter((d) => Boolean(d.adjunto));
    if (documentosValidos.length === 0) {
      return [];
    }

    const registros = await Promise.all(
      documentosValidos.map(async ({ tipo, adjunto }) => {
        const info = typeof adjunto === "string" ? { uri: adjunto } : adjunto;
        const nombreNorm = (info.nombre || "").toLowerCase();
        const uriNorm = (info.uri || "").toLowerCase().split("?")[0];
        const esPdf =
          info.tipo === "application/pdf" ||
          nombreNorm.endsWith(".pdf") ||
          uriNorm.endsWith(".pdf");
        const extension = esPdf ? "pdf" : "jpg";
        const ruta = `${usuarioId}/${tipo.toLowerCase()}-${Date.now()}.${extension}`;

        await this.subirArchivo(bucket, ruta, info.uri, {
          esPdf,
          anchoMaximo: 1200,
          calidad: 0.75,
        });

        return {
          usuario_id: usuarioId,
          tipo,
          url_archivo: ruta,
        };
      })
    );

    const { error } = await supabase.from("documentos").insert(registros);
    if (error) {
      throw new Error(`Error al registrar documentos en base de datos: ${error.message}`);
    }

    return registros;
  },

  /**
   * Obtiene la URL pública de un recurso almacenado
   */
  obtenerUrlPublica(bucket: string, ruta: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
    return data.publicUrl;
  },
};
