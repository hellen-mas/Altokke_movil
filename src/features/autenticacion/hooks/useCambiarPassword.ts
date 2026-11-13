import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { authService } from "@/features/autenticacion/services/authService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { useAsyncLock } from "@/shared/hooks/useAsyncLock";

export interface OpcionesCambiarPassword {
  onExito?: () => void;
  cerrarSesionAlTerminar?: boolean;
}

// Regla de fortaleza estándar (8+ carácteres, mayúscula, minúscula, número y símbolo)
export const REGEX_PASSWORD_SEGURA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#^()+=~`{}[\]:;"'<>,/|\\])[A-Za-z\d@$!%*?&._\-#^()+=~`{}[\]:;"'<>,/|\\]{8,}$/;

export function validarFortalezaPassword(password: string): { valida: boolean; mensaje?: string } {
  if (!password || password.length < 8) {
    return { valida: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!REGEX_PASSWORD_SEGURA.test(password)) {
    return {
      valida: false,
      mensaje: "La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un símbolo.",
    };
  }
  return { valida: true };
}

export function useCambiarPassword(opciones: OpcionesCambiarPassword = {}) {
  const [cargando, setCargando] = useState(false);
  const { ejecutarSeguro } = useAsyncLock();

  const cambiarPassword = useCallback(
    async (nuevaPassword: string, confirmarPassword: string, passwordActual?: string): Promise<boolean> => {
      if (!nuevaPassword || !confirmarPassword) {
        Alert.alert("Campos incompletos", "Por favor completa todos los campos de contraseña.");
        return false;
      }

      if (nuevaPassword !== confirmarPassword) {
        Alert.alert("Las contraseñas no coinciden", "Verifica que ambas contraseñas escritas sean iguales.");
        return false;
      }

      if (passwordActual && passwordActual === nuevaPassword) {
        Alert.alert("Usa una contraseña diferente", "La nueva contraseña debe ser distinta de la actual.");
        return false;
      }

      const validacion = validarFortalezaPassword(nuevaPassword);
      if (!validacion.valida) {
        Alert.alert("Contraseña débil", validacion.mensaje);
        return false;
      }

      const resultado = await ejecutarSeguro(async () => {
        setCargando(true);
        try {
          await authService.actualizarPassword(nuevaPassword);

          if (opciones.onExito) {
            opciones.onExito();
          } else {
            Alert.alert(
              "Contraseña actualizada",
              "Tu contraseña se actualizó correctamente."
            );
          }
          return true;
        } catch (error: unknown) {
          Alert.alert("Error al actualizar", traducirErrorAuth(error));
          return false;
        } finally {
          setCargando(false);
        }
      });

      return resultado ?? false;
    },
    [ejecutarSeguro, opciones]
  );

  return {
    cargando,
    cambiarPassword,
    validarFortaleza: validarFortalezaPassword,
  };
}

export default useCambiarPassword;
