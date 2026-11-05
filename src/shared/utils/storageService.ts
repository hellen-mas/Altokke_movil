import { supabase, invocarEdgeFunction } from "@/shared/api/supabase";
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

    // Validar las fotos de perfil antes de almacenarlas
    if (bucket === "avatars" && !esPdf) {
      const resultado = await invocarEdgeFunction<{
        ok: boolean;
        valid: boolean;
      }>("upload-avatar", {
        validateOnly: true,
        base64,
        mimeType: "image/jpeg",
      });

      if (!resultado.ok || !resultado.valid) {
        throw new Error (
          "La fotografía no superó la validación de seguridad"
        );
      }
    }

    // RLS: La subida a Storage es evaluada por politicas RLS en storage.objects (carpeta auth.uid())
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

    // Consultar los documentos ya registrados
    const { data: existentes, error: errorConsulta } = await supabase
      .from("documentos")
      .select("tipo, url_archivo, estado, fecha_subida")
      .eq("usuario_id", usuarioId)
      .order("fecha_subida", { ascending: false });

    if (errorConsulta) {
      throw new Error(
        `No se pudieron consultar los documentos: ${errorConsulta.message}`
      );
    }

    const registros : RegistroDocumentoSubido[] = [];

    for (const { tipo, adjunto } of documentosValidos) {
      // Evitar volver a registrar documentos existentes.
      const documentoExistente = existentes?.find(
        (documento) => 
          documento.tipo === tipo &&
          (documento.estado === "pendiente" ||
            documento.estado === "aprobado" )
      );

      if (documentoExistente) {
        registros.push({
          usuario_id: usuarioId,
          tipo,
          url_archivo: documentoExistente.url_archivo,
        });
        continue;
      }

      const info: ArchivoSubida =
        typeof adjunto === "string"
          ? { uri: adjunto }
          : adjunto;

      const nombreNorm = (info.nombre || "").toLowerCase();
      const uriNorm = (info.uri || "")
        .toLowerCase()
        .split("?")[0];

      const esPdf =
        info.tipo === "application/pdf" ||
        nombreNorm.endsWith(".pdf") ||
        uriNorm.endsWith(".pdf");

      const extension = esPdf ? "pdf" : "jpg";

      // Ruta estable para poder repetir una subida fallida.
      const ruta = `${usuarioId}/${tipo.toLowerCase()}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${extension}`;

      await this.subirArchivo(bucket, ruta, info.uri, {
        esPdf,
        anchoMaximo: 1200,
        calidad: 0.75,
      });

      const registro: RegistroDocumentoSubido = {
        usuario_id: usuarioId,
        tipo,
        url_archivo: ruta,
      };

      // RPC: Invocacion del procedimiento almacenado registrar_documento_conductor en PostgreSQL
      const { error: errorRegistro } = await supabase.rpc(
        "registrar_documento_conductor",
        {
          p_tipo: tipo,
          p_ruta: ruta,
        }
      );

      if (errorRegistro) {
        throw new Error(
          `No se pudo registrar ${tipo}: ${errorRegistro.message}`
        );
      }

      registros.push(registro);
    }

    return registros;

  },

  // Obtiene la URL pública de un archivo almacenado
  obtenerUrlPublica(bucket: string, ruta: string) : string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(ruta);
    
    return data.publicUrl;
  },
};
