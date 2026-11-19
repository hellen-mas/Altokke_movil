import { supabase } from "@/shared/api/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

export interface EventoCancelacionConductor {
  viajeId: string;
  motivo: string;
  fecha: Date;
}

interface UseCancelacionConductorOptions {
  onCancelado?: (evento: EventoCancelacionConductor) => void;
}

/**
 * Hook de tiempo real para detectar la cancelación del viaje por parte del conductor.
 * Escucha reactivamente la tabla de viajes y detecta transiciones hacia 'buscando' con
 * cancelado_por definido o motivo_cancelacion presente.
 *
 * Incluye guardia anti-duplicados y verificación en frío al abrir la app.
 */
export function useCancelacionConductor(
  viajeId: string | null,
  optionsOrCallback?: ((evento: EventoCancelacionConductor) => void) | UseCancelacionConductorOptions
) {
  const [cancelado, setCancelado] = useState(false);
  const [motivo, setMotivo] = useState<string | null>(null);

  const callback = typeof optionsOrCallback === "function" 
    ? optionsOrCallback 
    : optionsOrCallback?.onCancelado;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Guardia anti-duplicados por ID de viaje y timestamp
  const ultimoEventoProcesadoRef = useRef<string | null>(null);

  const dispararCancelacion = useCallback((id: string, motivoTexto: string) => {
    const claveEvento = `${id}_${motivoTexto}`;
    if (ultimoEventoProcesadoRef.current === claveEvento) {
      return;
    }
    ultimoEventoProcesadoRef.current = claveEvento;

    setCancelado(true);
    setMotivo(motivoTexto);

    const evento: EventoCancelacionConductor = {
      viajeId: id,
      motivo: motivoTexto,
      fecha: new Date(),
    };

    callbackRef.current?.(evento);
  }, []);

  const limpiarAviso = useCallback(() => {
    setCancelado(false);
    setMotivo(null);
  }, []);

  useEffect(() => {
    if (!viajeId) {
      setCancelado(false);
      setMotivo(null);
      return;
    }

    let activo = true;

    // 1. Verificación en frío (por si la cancelación ocurrió con la app cerrada)
    const verificarEstadoInicial = async () => {
      try {
        const { data, error } = await supabase
          .from("viajes")
          .select("id, estado, cancelado_por, motivo_cancelacion")
          .eq("id", viajeId)
          .maybeSingle();

        if (!activo || error || !data) return;

        // Si el viaje regresó a buscando y tiene registro de cancelación
        if (data.estado === "buscando" && (data.cancelado_por || data.motivo_cancelacion)) {
          const motivoReportado = data.motivo_cancelacion?.trim() || "El conductor no pudo completar el viaje";
          dispararCancelacion(data.id, motivoReportado);
        }
      } catch (err: unknown) {
        console.warn("[CANCELACION_HOOK] Aviso al verificar estado en frío:", err);
      }
    };

    void verificarEstadoInicial();

    // 2. Suscripción en vivo al canal Realtime del viaje
    const canal = supabase
      .channel(`cancelacion_conductor_${viajeId}`)
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
          const nuevo = payload.new as {
            id?: string;
            estado?: string;
            cancelado_por?: string | null;
            motivo_cancelacion?: string | null;
          };

          if (
            nuevo &&
            nuevo.id === viajeId &&
            nuevo.estado === "buscando" &&
            (Boolean(nuevo.cancelado_por) || Boolean(nuevo.motivo_cancelacion))
          ) {
            const motivoReportado =
              nuevo.motivo_cancelacion?.trim() || "El conductor canceló la solicitud";
            dispararCancelacion(nuevo.id, motivoReportado);
          }
        }
      )
      .subscribe();

    return () => {
      activo = false;
      void supabase.removeChannel(canal);
    };
  }, [viajeId, dispararCancelacion]);

  return {
    cancelado,
    motivo,
    limpiarAviso,
  };
}
