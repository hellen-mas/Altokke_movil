import { useState, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { authService } from "@/features/autenticacion/services/authService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { useCountdown } from "@/shared/hooks/useCountdown";

const LIMITE_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 5 * 60 * 1000; // 5 minutos
const COOLDOWN_REENVIO_SEG = 58;

interface OpcionesVerificarOtp {
  email?: string;
  onExito?: () => void;
}

export function useVerificarOtp({ email, onExito }: OpcionesVerificarOtp = {}) {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null);

  const { segundos, activo, reiniciar } = useCountdown(COOLDOWN_REENVIO_SEG);
  const estaVerificandoRef = useRef(false);

  const tiempoRestanteBloqueo = useCallback((): number => {
    if (!bloqueadoHasta) return 0;
    const restante = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
    return restante > 0 ? restante : 0;
  }, [bloqueadoHasta]);

  const verificarCodigo = useCallback(async () => {
    if (estaVerificandoRef.current || loading) return;

    const sBloqueo = tiempoRestanteBloqueo();
    if (sBloqueo > 0) {
      Alert.alert(
        "Acceso bloqueado",
        `Por seguridad, espera ${Math.ceil(sBloqueo / 60)} minutos antes de reintentar.`
      );
      return;
    }

    if (codigo.trim().length < 6) {
      Alert.alert("Código incompleto", "Ingresa el código completo de 6 dígitos.");
      return;
    }

    estaVerificandoRef.current = true;
    setLoading(true);

    try {
      await authService.verificarCodigoRecuperacion(email || "", codigo.trim());
      if (onExito) {
        onExito();
      } else {
        router.push("/recuperar-cuenta/nueva-contrasena");
      }
    } catch (error: unknown) {
      const nuevoConteo = intentos + 1;
      setIntentos(nuevoConteo);

      if (nuevoConteo >= LIMITE_INTENTOS) {
        setBloqueadoHasta(Date.now() + TIEMPO_BLOQUEO_MS);
        Alert.alert(
          "Acceso bloqueado",
          "Has alcanzado el límite de 5 intentos fallidos. Espera 5 minutos antes de volver a intentar."
        );
      } else {
        const restantes = LIMITE_INTENTOS - nuevoConteo;
        Alert.alert(
          "Código incorrecto",
          `${traducirErrorAuth(error)} (Intentos restantes: ${restantes})`
        );
      }
    } finally {
      estaVerificandoRef.current = false;
      setLoading(false);
    }
  }, [loading, tiempoRestanteBloqueo, codigo, email, onExito, intentos]);

  const reenviarCodigo = useCallback(async () => {
    if (activo || reenviando || !email) return;

    const sBloqueo = tiempoRestanteBloqueo();
    if (sBloqueo > 0) {
      Alert.alert(
        "Acceso bloqueado",
        `Espera ${Math.ceil(sBloqueo / 60)} minutos antes de solicitar otro código.`
      );
      return;
    }

    setReenviando(true);
    try {
      await authService.solicitarRecuperacionPassword(email);
      Alert.alert("Código reenviado", "Se envió un nuevo código de verificación a tu correo.");
      reiniciar(COOLDOWN_REENVIO_SEG);
    } catch (error: unknown) {
      Alert.alert("Error al reenviar", traducirErrorAuth(error));
    } finally {
      setReenviando(false);
    }
  }, [activo, reenviando, email, tiempoRestanteBloqueo, reiniciar]);

  return {
    codigo,
    setCodigo,
    loading,
    reenviando,
    intentos,
    intentosRestantes: Math.max(0, LIMITE_INTENTOS - intentos),
    bloqueado: tiempoRestanteBloqueo() > 0,
    segundos,
    activo,
    verificarCodigo,
    reenviarCodigo,
  };
}

export default useVerificarOtp;
