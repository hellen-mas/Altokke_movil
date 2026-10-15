import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";

export type TipoDocumento =
    | "DNI_FRONTAL"
    | "DNI_POSTERIOR"
    | "SELFIE"
    | "LICENCIA"
    | "SOAT"
    | "ANTECEDENTES";

type ArchivoSubida = {
    uri: string;
    nombre?: string;
    tipo?: string;
};

export async function subirDocumento(
  usuarioId: string,
  tipoDocumento: TipoDocumento,
  archivo: ArchivoSubida
): Promise<string> {

  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user || user.id !== usuarioId) {
    throw new Error("El conductor no está autenticado.");
  }

  if (!archivo.uri) {
    throw new Error("No se seleccionó ningún archivo.");
  }

  const esPdf =
    archivo.tipo === "application/pdf" ||
    archivo.nombre?.toLowerCase().endsWith(".pdf") ||
    archivo.uri.toLowerCase().split("?")[0].endsWith(".pdf");

  let uriFinal = archivo.uri;
  let contentType = "application/pdf";
  let extension = "pdf";

  if (!esPdf) {
    const imagen = await ImageManipulator.manipulateAsync(
      archivo.uri,
      [{ resize: { width: 1400 } }],
      {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    uriFinal = imagen.uri;
    contentType = "image/jpeg";
    extension = "jpg";
  }

  const info = await FileSystem.getInfoAsync(uriFinal);

  if (!info.exists) {
    throw new Error("El archivo no existe en el dispositivo.");
  }

  if (info.size && info.size > 5 * 1024 * 1024) {
    throw new Error("El archivo supera el límite de 5 MB.");
  }

  const base64 = await FileSystem.readAsStringAsync(
    uriFinal,
    {
      encoding: FileSystem.EncodingType.Base64,
    }
  );

  const nombre = `${tipoDocumento.toLowerCase()}-${Date.now()}.${extension}`;
  const ruta = `${usuarioId}/${nombre}`;

  const { error: storageError } = await supabase.storage
    .from("documentos-conductores")
    .upload(ruta, decode(base64), {
      contentType,
      upsert: false,
    });

  if (storageError) {
    throw new Error(storageError.message);
  }

  return ruta;
}

export async function guardarDocumentoBD (
    usuarioId: string,
    tipo: TipoDocumento,
    ruta: string
) {
    const {error} = await supabase
        .from("documentos")
        .insert({
            usuario_id: usuarioId,
            tipo,
            url_archivo: ruta,
            estado: "pendiente",
        });
    
    if (error) {
        throw new Error(
            `No se pudo registrar ${tipo}: ${error.message}`
        );
    }
}