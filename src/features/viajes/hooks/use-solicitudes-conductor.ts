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
  pagaCon: number | null;
  vueltoEstimado: number | null;
  creadoEn: string;
}

export function useSolicitudesConductor() {
  const [solicitudes, setSolicitudes] = useState<SolicitudViajeItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aceptandoId, setAceptandoId] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async () => {
    try {
      const datos = await conductorService.obtenerSolicitudesPendientes();
      setError(null);
      const mapeadas: SolicitudViajeItem[] = (datos ?? []).map((v) => {
        const item = v as typeof v & {
          paga_con?: number | null;
          vuelto_estimado?: number | null;
        };
        return {
          id: item.id,
          pasajeroId: item.pasajero_id,
          origenTexto: item.origen_texto,
          destinoTexto: item.destino_texto,
          tarifaEstimada: Number(item.tarifa_estimada),
          distanciaKm: item.distancia_km != null ? Number(item.distancia_km) : null,
          metodoPago: item.metodo_pago,
          pagaCon: item.paga_con != null ? Number(item.paga_con) : null,
          vueltoEstimado: item.vuelto_estimado != null ? Number(item.vuelto_estimado) : null,
          creadoEn: item.creado_en,
        };
      });
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

    conductorService
      .obtenerSolicitudesPendientes()
      .then((datos) => {
        if (!activo) return;
        setError(null);
        const mapeadas: SolicitudViajeItem[] = (datos ?? []).map((v) => {
          const item = v as typeof v & {
            paga_con?: number | null;
            vuelto_estimado?: number | null;
          };
          return {
            id: item.id,
            pasajeroId: item.pasajero_id,
            origenTexto: item.origen_texto,
            destinoTexto: item.destino_texto,
            tarifaEstimada: Number(item.tarifa_estimada),
            distanciaKm: item.distancia_km != null ? Number(item.distancia_km) : null,
            metodoPago: item.metodo_pago,
            pagaCon: item.paga_con != null ? Number(item.paga_con) : null,
            vueltoEstimado: item.vuelto_estimado != null ? Number(item.vuelto_estimado) : null,
            creadoEn: item.creado_en,
          };
        });
        setSolicitudes(mapeadas);
      })
      .catch((err) => {
        if (!activo) return;
        const msg = err instanceof Error ? err.message : "Error al cargar solicitudes";
        setError(msg);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

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
                pagaCon: nuevo.paga_con != null ? Number(nuevo.paga_con) : null,
                vueltoEstimado: nuevo.vuelto_estimado != null ? Number(nuevo.vuelto_estimado) : null,
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
      .subscribe((estado) => {
        if (!activo) return;
        if (estado === "SUBSCRIBED") {
          void cargarSolicitudes();
        }
      });

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
