import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { conductorService } from "@/features/conductores/services/conductorService";

export interface SolicitudViajeItem {
  id: string;
  pasajeroId: string;
  origenTexto: string;
  destinoTexto: string;
  tarifaEstimada: number;
  distanciaKm: number | null;
  metodoPago: string | null;
  creadoEn: string;
}

export function useSolicitudesConductor() {
  const [solicitudes, setSolicitudes] = useState<SolicitudViajeItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aceptandoId, setAceptandoId] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async () => {
    try {
      setError(null);
      const datos = await conductorService.obtenerSolicitudesPendientes();
      const mapeadas: SolicitudViajeItem[] = (datos ?? []).map((v) => ({
        id: v.id,
        pasajeroId: v.pasajero_id,
        origenTexto: v.origen_texto,
        destinoTexto: v.destino_texto,
        tarifaEstimada: Number(v.tarifa_estimada),
        distanciaKm: v.distancia_km != null ? Number(v.distancia_km) : null,
        metodoPago: v.metodo_pago,
        creadoEn: v.creado_en,
      }));
      setSolicitudes(mapeadas);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar solicitudes";
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    void cargarSolicitudes();

    const canal = supabase
      .channel("solicitudes_conductor_en_vivo")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "viajes",
        },
        (payload) => {
          if (!activo) return;

          if (payload.eventType === "INSERT") {
            const nuevo = payload.new as Record<string, unknown>;
            if (nuevo.estado === "buscando") {
              const item: SolicitudViajeItem = {
                id: String(nuevo.id),
                pasajeroId: String(nuevo.pasajero_id),
                origenTexto: String(nuevo.origen_texto ?? "Punto de partida"),
                destinoTexto: String(nuevo.destino_texto ?? "Destino"),
                tarifaEstimada: Number(nuevo.tarifa_estimada ?? 0),
                distanciaKm: nuevo.distancia_km != null ? Number(nuevo.distancia_km) : null,
                metodoPago: nuevo.metodo_pago != null ? String(nuevo.metodo_pago) : null,
                creadoEn: String(nuevo.creado_en ?? new Date().toISOString()),
              };
              setSolicitudes((prev) => {
                if (prev.some((s) => s.id === item.id)) return prev;
                return [item, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const modificado = payload.new as Record<string, unknown>;
            if (modificado.estado !== "buscando") {
              setSolicitudes((prev) => prev.filter((s) => s.id !== modificado.id));
            }
          } else if (payload.eventType === "DELETE") {
            const eliminado = payload.old as Record<string, unknown>;
            setSolicitudes((prev) => prev.filter((s) => s.id !== eliminado.id));
          }
        }
      )
      .subscribe();

    return () => {
      activo = false;
      void supabase.removeChannel(canal);
    };
  }, [cargarSolicitudes]);

  const aceptarSolicitud = useCallback(async (viajeId: string): Promise<boolean> => {
    setAceptandoId(viajeId);
    setError(null);
    try {
      await conductorService.aceptarSolicitud(viajeId);
      setSolicitudes((prev) => prev.filter((s) => s.id !== viajeId));
      return true;
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("Solicitud no disponible")
          ? "Esta carrera ya fue tomada por otro conductor cercano."
          : err instanceof Error
          ? err.message
          : "No se pudo aceptar la solicitud.";
      setError(msg);
      // Remover la solicitud de la lista porque ya no está disponible
      setSolicitudes((prev) => prev.filter((s) => s.id !== viajeId));
      return false;
    } finally {
      setAceptandoId(null);
    }
  }, []);

  const rechazarSolicitud = useCallback((viajeId: string) => {
    setSolicitudes((prev) => prev.filter((s) => s.id !== viajeId));
  }, []);

  return {
    solicitudes,
    cargando,
    error,
    aceptandoId,
    recargar: cargarSolicitudes,
    aceptarSolicitud,
    rechazarSolicitud,
  };
}
