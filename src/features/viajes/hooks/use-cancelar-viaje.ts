import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { viajeService } from "@/features/viajes/services/viajeService";
import { useNotificaciones } from "@/features/notificaciones/hooks/useNotificaciones";

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
  const [modalVisible, setModalVisible] = useState(false)

  // Abrir el modal de cancelación
  const solicitarCancelacion = useCallback(() => {
    if (cancelando) return;

    setModalVisible(true);
  }, [cancelando]);

  // Cerrar el modal
  const cerrarModal = useCallback(() => {
    if (cancelando) return;
    setModalVisible(false);
  }, [cancelando]);

  // Ejecutar la cancelación enviando el motivo a Supabase
  const ejecutarCancelacion = useCallback(async (motivo: string): Promise<boolean> => {
    const motivoValidado = motivo.trim();

    if (!motivoValidado) {
      Alert.alert(
        "Motivo requerido",
        "Debes seleccionar un motivo para cancelar el viaje."
      );
      return false;
    }

    if (!viajeActivoId) {
      Alert.alert(
        "Viaje no encontrado",
        "No se pudo identificar el viaje que deseas cancelar."
      );
      return false;
    }

    if (cancelando) return false;
    setCancelando(true);

    try {
      const resultado = await viajeService.cancelarViaje(viajeActivoId, motivoValidado);

      if (!resultado) {
        Alert.alert(
          "No se pudo cancelar",
          "El viaje ya pudo haber cambiado de estado o no tienes permisos para cancelarlo."
        );
        return false;
      }

      // Registrar el cambio en el sistema de notificaciones
      await procesarEstadoViaje(viajeActivoId, "cancelado_pasajero");

      // Cerrar el modal y limpiar el viaje local
      setModalVisible(false);
      setViajeActivoId(null);
      setDestino(null);

      Alert.alert(
        "Viaje cancelado",
        "Tu solicitud de viaje ha sido cancelada exitosamente.",
        [{ text: "Aceptar", onPress: () => router.replace("/mapa") }]
      );
      return true;
    } catch (error) {
      console.error("Error al ejecutar la cancelación del viaje.", error);
      Alert.alert(
        "Error inesperado",
        "Ocurrió un problema al cancelar el viaje. Inténtalo nuevamente."
      );
      return false;
    } finally {
      setCancelando(false);
    }
  }, [viajeActivoId, cancelando, setViajeActivoId, setDestino, procesarEstadoViaje]);

  const confirmarCancelación = useCallback(async(motivo: string): Promise<void> => {
    await ejecutarCancelacion(motivo);
  }, [ejecutarCancelacion]);

  const esCancelable = puedeCancelarViaje(estadoActual || "buscando");

  return {
    cancelando,
    esCancelable,
    modalVisible,
    solicitarCancelacion,
    cerrarModal,
    ejecutarCancelacion,
    confirmarCancelación,
  };
}
