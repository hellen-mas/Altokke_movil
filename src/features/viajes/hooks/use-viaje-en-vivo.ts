import { supabase } from "@/shared/api/supabase";
import { Tables } from "@/shared/types/database.types";
import { useEffect, useState } from "react";

let secuenciaCanalesViaje = 0;

export type ViajeEnVivo = Tables<"viajes">;

export function useViajeEnVivo(viajeId: string | null) {
  const [viaje, setViaje] = useState<ViajeEnVivo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    if (!viajeId) return;
    let activo = true;

    // Carga: el viaje tal cual está ahora
    const cargar = async () => {
      try {
        const { data, error: errorCarga } = await supabase
          .from("viajes")
          .select("*")
          .eq("id", viajeId)
          .maybeSingle();

        if (!activo) return;
        if (errorCarga) {
          setError(errorCarga.message);
          return;
        }
        setError(null);
        setViaje((prev) => {
          if (!prev) return data;
          if (!data) return null;
          const fechaPrev = new Date(prev.finalizado_en ?? prev.aceptado_en ?? prev.creado_en ?? 0).getTime();
          const fechaData = new Date(data.finalizado_en ?? data.aceptado_en ?? data.creado_en ?? 0).getTime();
          return fechaData >= fechaPrev ? data : prev;
        });
      } catch (err: unknown) {
        if (!activo) return;
        console.warn("Aviso al consultar viaje en vivo:", err);
        setError(err instanceof Error ? err.message : "Error de conectividad");
      }
    };

    cargar();

    // Identificador único para cada instancia de suscripción
    const identificadorCanal =
      `${Date.now()}_${++secuenciaCanalesViaje}`;

    // Suscripción: cada cambio del viaje llega a esta parte
    const canal = supabase
      .channel(`viaje_en_vivo_${viajeId}_${identificadorCanal}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "viajes",
          filter: `id=eq.${viajeId}`,
        },
        (payload) => {
          if (!activo) return;
          const nuevo = payload.new as ViajeEnVivo;
          setViaje((prev) => {
            if (!prev) return nuevo;
            const fechaPrev = new Date(prev.finalizado_en ?? prev.aceptado_en ?? prev.creado_en ?? 0).getTime();
            const fechaNuevo = new Date(nuevo.finalizado_en ?? nuevo.aceptado_en ?? nuevo.creado_en ?? 0).getTime();
            return fechaNuevo >= fechaPrev ? nuevo : prev;
          });
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
