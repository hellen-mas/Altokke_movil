import { useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import type { InfoConductor } from "@/features/viajes/components/TarjetaConductor";

export type ConductorViaje = InfoConductor & {
  telefono: string;
  lat: number | null;
  lng: number | null;
};

export function useConductorViaje(
  viajeId: string | null,
  conductorId: string | null | undefined,
  refrescarCadaMs?: number
) {
  const [conductor, setConductor] = useState<ConductorViaje | null>(null);

  useEffect(() => {
    if (!viajeId || !conductorId) return;
    let activo = true;

    const cargar = () => {
      supabase
        .rpc("obtener_conductor_viaje", { p_viaje_id: viajeId })
        .then(({ data, error }) => {
          if (!activo) return;
          if (error) {
            console.warn("Aviso al obtener el conductor del viaje:", error.message);
            return;
          }
          const fila = data?.[0];
          if (!fila) return;

          setConductor({
            nombre: `${fila.nombre} ${fila.apellidos}`.trim(),
            calificacion: fila.calificacion ?? undefined,
            viajes: fila.viajes_completados ?? undefined,
            vehiculo: [fila.marca, fila.modelo].filter(Boolean).join(" ") || undefined,
            placa: fila.placa ?? undefined,
            color: fila.color ?? undefined,
            foto: fila.foto_url,
            telefono: fila.telefono,
            lat: fila.lat_actual,
            lng: fila.lng_actual,
          });
        });
    };

    cargar();
    const reloj = refrescarCadaMs ? setInterval(cargar, refrescarCadaMs) : null;

    return () => {
      activo = false;
      if (reloj) clearInterval(reloj);
    };
  }, [viajeId, conductorId, refrescarCadaMs]);

  return conductor;
}
