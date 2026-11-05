import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import {
  seleccionarFotoGaleria,
  subirFotoAvatar,
  validarFotoModeracion,
} from "@/shared/utils/avatar";

interface OpcionesSubirAvatar {
  userId?: string | null;
  onExito?: (url?: string) => Promise<void> | void;
}

export function useSubirAvatar({ userId, onExito }: OpcionesSubirAvatar = {}) {
  const [subiendo, setSubiendo] = useState(false);
  const cerrojoRef = useRef(false);

  const cambiarFoto = useCallback(async () => {
    if (cerrojoRef.current || subiendo) return;

    try {
      const res = await seleccionarFotoGaleria();
      if (!res) return;

      if (!userId) {
        Alert.alert("Sesión requerida", "Debes iniciar sesión para actualizar tu foto de perfil.");
        return;
      }

      cerrojoRef.current = true;
      setSubiendo(true);

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
    } catch (err: unknown) {
      Alert.alert(
        "Error al actualizar",
        err instanceof Error ? err.message : "No se pudo actualizar la foto de perfil."
      );
    } finally {
      cerrojoRef.current = false;
      setSubiendo(false);
    }
  }, [subiendo, userId, onExito]);

  return {
    subiendo,
    cambiarFoto,
  };
}

export default useSubirAvatar;
