import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { viajeService } from "@/features/viajes/services/viajeService";
import { useNotificaciones } from "@/features/notificaciones/context/NotificacionesContext";
import { supabase } from "@/shared/api/supabase";

export const ESTADOS_CANCELABLES = [
  "buscando",
  "aceptado",
  "en_camino_origen",
  "esperando_pasajero",
] as const;

export type EstadoCancelable = (typeof ESTADOS_CANCELABLES)[number];

export function puedeCancelarViaje(estado: string | null | undefined): boolean {
  if (!estado) return false;
  return (ESTADOS_CANCELABLES as readonly string[]).includes(estado);
}

export function useCancelarViaje(estadoActual?: string) {
  const { viajeActivoId, setViajeActivoId, setDestino } = useViaje();
  const { procesarEstadoViaje } = useNotificaciones();
  const [cancelando, setCancelando] = useState(false);
  const cancelacionNotificadaRef = useRef(false);

  // Manejador cuando el conductor cancela el viaje
  const manejarCancelacionConductor = useCallback(() => {
    if (cancelacionNotificadaRef.current) return;
    cancelacionNotificadaRef.current = true;

    Alert.alert(
      "Viaje cancelado por el conductor",
      "El conductor no pudo continuar con tu solicitud. ¿Deseas buscar otro mototaxi de inmediato?",
      [
        {
          text: "Volver al mapa",
          style: "cancel",
          onPress: () => {
            setViajeActivoId(null);
            setDestino(null);
            router.replace("/mapa");
          },
        },
        {
          text: "Buscar otro",
          onPress: () => {
            setViajeActivoId(null);
            // Conserva el destino para no tener que ingresarlo de nuevo
            router.replace("/confirmar-viaje");
          },
        },
      ]
    );
  }, [setViajeActivoId, setDestino]);

  // Ejecución directa de la llamada al backend RPC cancelar_viaje_pasajero
  const ejecutarCancelacion = useCallback(async (): Promise<boolean> => {
    setCancelando(true);
    try {
      if (!viajeActivoId) {
        // En caso de que no exista en backend (ej. modo offline o prueba local)
        setViajeActivoId(null);
        setDestino(null);
        Alert.alert(
          "Viaje cancelado",
          "Tu solicitud ha sido cancelada.",
          [{ text: "OK", onPress: () => router.replace("/mapa") }]
        );
        return true;
      }

      const resultado = await viajeService.cancelarViaje(viajeActivoId);

      if (!resultado) {
        Alert.alert(
          "Error al cancelar",
          "No se pudo cancelar el viaje. Es posible que el viaje ya haya iniciado o no tengas permisos para cancelarlo."
        );
        return false;
      }

      // Notificar al contexto de notificaciones sobre el evento
      await procesarEstadoViaje(viajeActivoId, "cancelado_pasajero");

      // Limpiar estados locales y volver al mapa
      setViajeActivoId(null);
      setDestino(null);

      Alert.alert(
        "Viaje cancelado",
        "Tu solicitud de viaje ha sido cancelada exitosamente.",
        [{ text: "OK", onPress: () => router.replace("/mapa") }]
      );
      return true;
    } catch (err) {
      console.warn("Fallo inesperado al cancelar viaje:", err);
      Alert.alert(
        "Error",
        "Ocurrió un error inesperado al intentar cancelar el viaje."
      );
      return false;
    } finally {
      setCancelando(false);
    }
  }, [viajeActivoId, setViajeActivoId, setDestino, procesarEstadoViaje]);

  // Alerta de confirmación antes de cancelar
  const solicitarCancelacion = useCallback(() => {
    if (cancelando) return;

    Alert.alert(
      "Cancelar viaje",
      "¿Estás seguro de que deseas cancelar este viaje?",
      [
        {
          text: "No, mantener viaje",
          style: "cancel",
        },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => {
            void ejecutarCancelacion();
          },
        },
      ]
    );
  }, [cancelando, ejecutarCancelacion]);

  // Monitorear en tiempo real si el conductor cancela el viaje
  useEffect(() => {
    if (!viajeActivoId) return;

    const canal = supabase
      .channel(`monitoreo_cancelacion_${viajeActivoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "viajes",
          filter: `id=eq.${viajeActivoId}`,
        },
        (payload) => {
          const viaje = payload.new as any;
          if (viaje?.estado === "cancelado_conductor") {
            void procesarEstadoViaje(viajeActivoId, "cancelado_conductor");
            manejarCancelacionConductor();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [viajeActivoId, procesarEstadoViaje, manejarCancelacionConductor]);

  const esCancelable = puedeCancelarViaje(estadoActual || "buscando");

  return {
    cancelando,
    esCancelable,
    solicitarCancelacion,
    ejecutarCancelacion,
    manejarCancelacionConductor,
  };
}
