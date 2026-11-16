import { useCallback } from "react";
import { Platform, Vibration } from "react-native";

export interface AltokkeHaptics {
  impactoLigero: () => void;
  alertaNuevaSolicitud: () => void;
  notificacionExito: () => void;
  alarmaEmergenciaSos: () => void;
  cancelarVibracion: () => void;
}

/**
 * Hook de vibración y respuesta háptica táctil para Altokke Móvil.
 * Utiliza la API nativa de Vibration de React Native, optimizada para mototaxis en Bagua.
 */
export function useHaptics(): AltokkeHaptics {
  const impactoLigero = useCallback(() => {
    if (Platform.OS === "android") {
      Vibration.vibrate(15);
    }
  }, []);

  const alertaNuevaSolicitud = useCallback(() => {
    // Patrón doble para alertar al conductor sobre ruido del motor
    Vibration.vibrate([0, 150, 80, 200]);
  }, []);

  const notificacionExito = useCallback(() => {
    // Patrón sutil de confirmación
    Vibration.vibrate([0, 40, 40, 60]);
  }, []);

  const alarmaEmergenciaSos = useCallback(() => {
    // Patrón SOS continuo en código morse / pulso de alarma
    Vibration.vibrate([0, 300, 100, 300, 100, 500]);
  }, []);

  const cancelarVibracion = useCallback(() => {
    Vibration.cancel();
  }, []);

  return {
    impactoLigero,
    alertaNuevaSolicitud,
    notificacionExito,
    alarmaEmergenciaSos,
    cancelarVibracion,
  };
}
