import { useState, useRef, useCallback } from "react";
import { Alert, Keyboard } from "react-native";
import { router } from "expo-router";
import { useAuth, type RolUsuario } from "@/features/autenticacion/hooks/useAuth";
import { authService } from "@/features/autenticacion/services/authService";
import { obtenerEstadoConductor } from "@/features/conductores/services/conductorService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { TipoDatosLogin } from "@/features/autenticacion/utils/validacionesAuth";

export function useLoginSession() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const bloqueoEnvioRef = useRef(false);

  const procesarSesionUsuario = useCallback(async (user: { id: string; user_metadata?: Record<string, unknown> }) => {
    const rol = user.user_metadata?.rol as RolUsuario | undefined;
    const dni = user.user_metadata?.dni as string | undefined;

    if (!rol || !dni) {
      Alert.alert("¡Bienvenido!", "Completa tu registro seleccionando tu rol.", [
        { text: "Continuar", onPress: () => router.replace("/crear-cuenta") },
      ]);
      return;
    }

    login(rol);

    if (rol === "conductor") {
      await obtenerEstadoConductor(user.id);
      router.replace("/(auth)/estado-solicitud");
      return;
    }

    router.replace("/mapa");
  }, [login]);

  const ejecutarAutenticacion = useCallback(async (accion: () => Promise<any>) => {
    // Cerrojo contra toques repetidos o envíos en paralelo
    if (bloqueoEnvioRef.current || loading) return;

    bloqueoEnvioRef.current = true;
    Keyboard.dismiss();
    setLoading(true);

    try {
      const user = await accion();
      if (user) {
        await procesarSesionUsuario(user);
      }
    } catch (err: unknown) {
      Alert.alert(
        "Inicio de sesión",
        traducirErrorAuth(err, "Comprueba tus datos e inténtalo nuevamente.")
      );
    } finally {
      bloqueoEnvioRef.current = false;
      setLoading(false);
    }
  }, [loading, procesarSesionUsuario]);

  const iniciarSesionCorreo = useCallback((datos: TipoDatosLogin) => {
    return ejecutarAutenticacion(() =>
      authService.loginConPassword(datos.correo, datos.contrasena)
    );
  }, [ejecutarAutenticacion]);

  const iniciarSesionGoogle = useCallback(() => {
    return ejecutarAutenticacion(() => authService.loginConGoogle());
  }, [ejecutarAutenticacion]);

  return {
    loading,
    iniciarSesionCorreo,
    iniciarSesionGoogle,
  };
}

export default useLoginSession;
