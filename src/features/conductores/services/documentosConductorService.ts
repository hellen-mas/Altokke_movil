import { supabase } from "@/shared/api/supabase";
import type { Database } from "@/shared/types/database.schema";

type TipoDocumento =
  Database["public"]["Enums"]["tipo_documento"];

const BUCKET_DOCUMENTOS = "documentos-conductores";

// La URL firmada tendrá una vigencia de 5 minutos
const DURACION_URL_SEGUNDOS = 300;

const ETIQUETAS_DOCUMENTOS: Record<TipoDocumento, string> = {
    DNI: "Documento de identidad",
    DNI_FRONTAL: "DNI - Frontal",
    DNI_POSTERIOR: "DNI - Reverso",
    SELFIE: "Selfie con DNI",
    LICENCIA: "Licencia de conducir",
    SOAT: "SOAT",
    ANTECEDENTES: "Antecedentes penales",
    TARJETA_PROPIEDAD: "Tarjeta de propiedad",
};

export interface DocumentoConductor {
    id: string;
    tipo: TipoDocumento;
    titulo: string;
    ruta: string;
    fechaSubida: string;
    formato: "pdf" | "imagen";
}

export const documentosConductorService = {
    // Obtiene los docs registrados del conductor
    async obtenerDocumentos(
        usuarioId: string
    ): Promise<DocumentoConductor[]> {
        if (!usuarioId) {
            throw new Error("No se identificó al conductor.");
        }

        const { data, error } = await supabase
            .from("documentos")
            .select("id, tipo, url_archivo, fecha_subida")
            .eq("usuario_id", usuarioId)
            .order("fecha_subida", { ascending: false });
        
        if (error) {
            throw new Error(
                `No se pudieron consultar los documentos: ${error.message}`
            );
        }

        return (data ?? []).map((documento) => {
            const ruta = documento.url_archivo;
            const esPdf = ruta.toLowerCase().endsWith(".pdf");

            return {
                id: documento.id,
                tipo: documento.tipo,
                titulo: ETIQUETAS_DOCUMENTOS[documento.tipo],
                ruta,
                fechaSubida: documento.fecha_subida,
                formato: esPdf ? "pdf" : "imagen",
            };
        });
    },

    // Genera una URL firmada para consultar un documento privado
    async obtenerUrlFirmada(
        usuarioId: string,
        ruta: string
    ): Promise<string> {
        if (!usuarioId || !ruta) {
            throw new Error("Faltan datos para abrir el documento.");
        }

        // Impide solicitar archivos de otras carpetas.
        if (
            !ruta.startsWith(`${usuarioId}/`) ||
            ruta.includes("..")
        ) {
            throw new Error(
                "No tienes autorización para consultar este documento."
            );
        }

        const { data, error } = await supabase.storage
            .from(BUCKET_DOCUMENTOS)
            .createSignedUrl(ruta, DURACION_URL_SEGUNDOS);

        if (error || !data?.signedUrl) {
            throw new Error(
                error?.message || "No se pudo generar el enlace del documento."
            );
        }

        return data.signedUrl;
    },
};