import { supabase } from "@/shared/api/supabase";
import type { EstadoConductor } from "./conductorService";

export interface EstadoSolicitudConductor {
    estado: EstadoConductor;
    pantallaAprobacionVista: boolean;
}

// Consulta el estado de aprobación y si el conductor ya visualizcó la pantalla de solicitud aprobada
export async function obtenerEstadoSolicitudConductor(
    usuarioId: string
): Promise<EstadoSolicitudConductor> {
    if (!usuarioId) {
        throw new Error("Se requiere el ID del conductor.");
    }

    const { data, error } = await supabase
        .from("conductores_perfil")
        .select("estado, pantalla_aprobacion_vista")
        .eq("usuario_id", usuarioId)
        .single();

    if (error) {
        throw new Error(
        `No se pudo consultar el estado de solicitud: ${error.message}`
        );
    }

    if (!data?.estado) {
        throw new Error("No se encontró la solicitud del conductor.");
    }

    return {
        estado: data.estado as EstadoConductor,
        pantallaAprobacionVista:
        data.pantalla_aprobacion_vista ?? false,
    };
}

// Determina la pantalla inicial del conductor
export async function obtenerDestinoInicialConductor(
    usuarioId: string
): Promise<"/(auth)/estado-solicitud" | "/inicio"> {
    const solicitud = await obtenerEstadoSolicitudConductor(usuarioId);

    if (
        solicitud.estado === "aprobado" &&
        solicitud.pantallaAprobacionVista
    ) {
        return "/inicio";
    }

    return "/(auth)/estado-solicitud";
}