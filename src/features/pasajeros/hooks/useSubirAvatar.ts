import { useState, useCallback } from "react";
import { Alert } from "react-native";
import {
  seleccionarFotoGaleria,
  subirFotoAvatar,
  validarFotoModeracion,
} from "@/shared/utils/avatar";
import { useAsyncLock } from "@/shared/hooks/useAsyncLock";

interface OpcionesSubirAvatar {
  userId?: string | null;
  onExito?: (url?: string) => Promise<void> | void;
}

export function useSubirAvatar({ userId, onExito }: OpcionesSubirAvatar = {}) {
  const [subiendo, setSubiendo] = useState(false);
  const { ejecutarSeguro } = useAsyncLock();

  const cambiarFoto = useCallback(async () => {
    try {
      const res = await seleccionarFotoGaleria();
      if (!res) return;

      if (!userId) {
        Alert.alert("Sesión requerida", "Debes iniciar sesión para actualizar tu foto de perfil.");
        return;
      }

      await ejecutarSeguro(async () => {
        setSubiendo(true);
        try {
          // Pre-validación de moderación visual con Sightengine
          if (res.base64) {
            const moderacion = await validarFotoModeracion(res, res.base64);
            if (!moderacion.ok) {
              Alert.alert(
                "Foto no permitida",
                moderacion.error ||
                  "La fotografía seleccionada no cumple con las políticas de contenido y seguridad visual de Altokke."
              );
              return;
            }
          }

          // Subida de fotografía
          const resultado = await subirFotoAvatar(res.uri, userId, res.base64);

          if (!resultado.ok) {
            Alert.alert(
              "No se pudo guardar la foto",
              resultado.error ||
                "El sistema de moderación rechazó la imagen o hubo un fallo de conexión. Intenta con otra foto."
            );
            return;
          }

          if (onExito) {
            await onExito(resultado.url);
          }

          Alert.alert(
            "Foto actualizada",
            "Tu foto de perfil fue guardada y verificada correctamente."
          );
        } finally {
          setSubiendo(false);
        }
      });
    } catch (err: unknown) {
      Alert.alert(
        "Error al actualizar",
        err instanceof Error ? err.message : "No se pudo actualizar la foto de perfil."
      );
    }
  }, [ejecutarSeguro, userId, onExito]);

  return {
    subiendo,
    cambiarFoto,
  };
}

export default useSubirAvatar;
