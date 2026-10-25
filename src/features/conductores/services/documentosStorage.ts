import { supabase } from "@/shared/api/supabase";
import { storageService } from "@/shared/utils/storageService";

export type TipoDocumento =
  | "DNI_FRONTAL"
  | "DNI_POSTERIOR"
  | "SELFIE"
  | "LICENCIA"
  | "SOAT"
  | "ANTECEDENTES";

export type ArchivoSubida = {
  uri: string;
  nombre?: string;
  tipo?: string;
};

export async function subirDocumento(
  usuarioId: string,
  tipoDocumento: TipoDocumento,
  archivo: ArchivoSubida
): Promise<string> {
  const esPdf =
    archivo.tipo === "application/pdf" ||
    archivo.nombre?.toLowerCase().endsWith(".pdf") ||
    archivo.uri.toLowerCase().split("?")[0].endsWith(".pdf");

  const ext = esPdf ? "pdf" : "jpg";
  const ruta = `${usuarioId}/${tipoDocumento.toLowerCase()}-${Date.now()}.${ext}`;

  return await storageService.subirArchivo("documentos-conductores", ruta, archivo.uri, {
    esPdf,
    anchoMaximo: 1200,
    calidad: 0.75,
  });
}

export async function guardarDocumentoBD(
  usuarioId: string,
  tipo: TipoDocumento,
  ruta: string
) {
  const { error } = await supabase.from("documentos").insert({
    usuario_id: usuarioId,
    tipo,
    url_archivo: ruta,
    estado: "pendiente",
  });
  if (error) throw new Error(`No se pudo registrar ${tipo}: ${error.message}`);
}