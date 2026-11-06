import { useState, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { authService } from "@/features/autenticacion/services/authService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { TipoDatosRecuperar } from "@/features/autenticacion/utils/validacionesAuth";

const ESPERA_COOLDOWN_MS = 60000;

export function useRecuperarPassword() {
  const [loading, setLoading] = useState(false);
  const ultimoEnvioRef = useRef<Map<string, number>>(new Map());
  const cerrojoRef = useRef(false);

  const solicitarCodigo = useCallback(async ({ correo }: TipoDatosRecuperar) => {
    if (cerrojoRef.current || loading) return;

    const normalizado = correo.trim().toLowerCase();
    const ahora = Date.now(); // Llamada pura dentro de un evento asíncrono
    const ultimo = ultimoEnvioRef.current.get(normalizado);

    if (ultimo && ahora - ultimo < ESPERA_COOLDOWN_MS) {
      const seg = Math.ceil((ESPERA_COOLDOWN_MS - (ahora - ultimo)) / 1000);
      Alert.alert(
        "Espera un momento",
        `Podrás solicitar otro código en ${seg} segundos.`
      );
      return;
    }

    cerrojoRef.current = true;
    setLoading(true);

    try {
      await authService.solicitarRecuperacionPassword(normalizado);
      ultimoEnvioRef.current.set(normalizado, Date.now());
      router.push(
        `/recuperar-cuenta/verificar-codigo?email=${encodeURIComponent(normalizado)}`
      );
    } catch (error: unknown) {
      Alert.alert("Error al enviar código", traducirErrorAuth(error));
    } finally {
      cerrojoRef.current = false;
      setLoading(false);
    }
  }, [loading]);

  return {
    loading,
    solicitarCodigo,
  };
}

export default useRecuperarPassword;
