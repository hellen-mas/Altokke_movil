import { useState, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { authService } from "@/features/autenticacion/services/authService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import type { TipoDatosRecuperar } from "@/features/autenticacion/utils/validacionesAuth";
import { useAsyncLock } from "@/shared/hooks/useAsyncLock";

const ESPERA_COOLDOWN_MS = 60000;

interface OpcionesRecuperarPassword {
  email?: string | null;
  onCodigoEnviado?: (email: string) => void;
}

export function useRecuperarPassword({
  email,
  onCodigoEnviado,
}: OpcionesRecuperarPassword = {}) {
  const [loading, setLoading] = useState(false);
  const ultimoEnvioRef = useRef<Map<string, number>>(new Map());
  const { ejecutarSeguro } = useAsyncLock();

  const solicitarCodigo = useCallback(
    async (datos?: TipoDatosRecuperar) => {
      const normalizado = (email || datos?.correo || "").trim().toLowerCase();

      if (!normalizado) {
        Alert.alert(
          "Correo no disponible",
          "No encontramos un correo electrónico asociado a tu cuenta."
        );
        return;
      }

      const ahora = Date.now();
      const ultimo = ultimoEnvioRef.current.get(normalizado);

      if (ultimo && ahora - ultimo < ESPERA_COOLDOWN_MS) {
        const segundos = Math.ceil((ESPERA_COOLDOWN_MS - (ahora - ultimo)) / 1000);
        Alert.alert(
          "Espera un momento",
          `Podrás solicitar otro código en ${segundos} segundos.`
        );
      
        return;
    }

    await ejecutarSeguro(async () => {
      setLoading(true);
      try {
        await authService.solicitarRecuperacionPassword(normalizado);
        ultimoEnvioRef.current.set(normalizado, Date.now());
        if (onCodigoEnviado) {
          onCodigoEnviado(normalizado);
        } else {
          router.push(
            `/recuperar-cuenta/verificar-codigo?email=${encodeURIComponent(normalizado)}`
          );
        }
      } catch (error: unknown) {
        Alert.alert("Error al enviar código", traducirErrorAuth(error));
      } finally {
        setLoading(false);
      }
    });
  }, [ejecutarSeguro, email, onCodigoEnviado]);

  return {
    loading,
    solicitarCodigo,
  };
}

export default useRecuperarPassword;
