
import { supabase } from "@/lib/supabase";

export type EstadoConductor =
  | "pendiente"
  | "aprobado"
  | "rechazado"
  | "suspendido";

export async function obtenerEstadoConductor(
  usuarioId: string
): Promise<EstadoConductor> {

  const { data, error } = await supabase
    .from("conductores_perfil")
    .select("estado")
    .eq("usuario_id", usuarioId)
    .single();

  if (error) {
    throw new Error(
      `Error al consultar la solicitud: ${error.message}`
    );
  }

  if (!data?.estado) {
    throw new Error(
      "No se encontró la solicitud del conductor."
    );
  }

  return data.estado as EstadoConductor;
}
