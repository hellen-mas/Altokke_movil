import { supabase } from "@/shared/api/supabase";
import { Tables } from "@/shared/types/database.types";
import { useEffect, useState } from "react";

export type ViajeEnVivo = Tables<"viajes">;

export function useViajeEnVivo (viajeId: string | null){
  const [viaje, setViaje] = useState<ViajeEnVivo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    if (!viajeId) return;
    let activo = true;

    // Carga: el viaje tal cual está ahora
    const cargar = () => {
      supabase
        .from("viajes")
        .select("*")
        .eq("id", viajeId)
        .maybeSingle()
        .then(({ data, error: errorCarga }) => {
          if (!activo) return;
          if (errorCarga) {
            setError(errorCarga.message);
            return;
          }
          setError(null);
          setViaje(data);
        });
    };

    cargar();

    // Suscripción: cada cambio del viaje llega a esta parte
    const canal = supabase
      .channel(`viaje_en_vivo_${viajeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "viajes",
          filter: `id=eq.${viajeId}`,
        },
        (payload) => {
          setViaje(payload.new as ViajeEnVivo);
        }
      )
      .subscribe((estado) => {
        if (!activo) return;
        if (estado === "SUBSCRIBED") {
          setConectado(true);
          // Al reconectar se recarga, por si hubo cambios mientras no había señal
          cargar();
        } else {
          setConectado(false);
        }
      });

    // Limpieza: al salir de la pantalla se cierra la suscripción
    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [viajeId]);

  const cargando = Boolean(viajeId) && viaje === null && error === null;

  return { viaje, cargando, error, conectado };
}
