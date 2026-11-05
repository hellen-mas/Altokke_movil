import { supabase } from "@/shared/api/supabase";

// Escucha en tiempo real los cambios de los viajes del pasajero.
// Devuelve una función para dejar de escuchar.
export function suscribirseAViajesDelPasajero(
  pasajeroId: string,
  alCambiarEstado: (viajeId: string, estado: string) => void
): () => void {
  const canal = supabase
    .channel(`canal_notificaciones_pasajero_${pasajeroId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "viajes",
        filter: `pasajero_id=eq.${pasajeroId}`,
      },
      (payload) => {
        const viaje = payload.new as { id?: string; estado?: string | null };
        if (viaje?.id && viaje?.estado) {
          alCambiarEstado(viaje.id, viaje.estado);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}