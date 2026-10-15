import {
  BotonPrincipal,
  CampoCodigoVerificacion,
  ContenedorPantalla,
  EncabezadoLogo,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function VerificacionCodigoScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();

  const [codigo, setCodigo] = useState("");
  const [timer, setTimer] = useState(58);
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerificar = async () => {
    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      const segundosRestantes = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      Alert.alert(
        "Demasiados intentos",
        `Has superado el límite de intentos permitidos. Por seguridad, espera ${segundosRestantes} segundos antes de volver a intentar.`
      );
      return;
    }

    if (codigo.length < 6) {
      Alert.alert(
        "Código incompleto",
        "Por favor, ingresa el código completo de 6 dígitos.",
      );
      return;
    }

    setLoading(true);

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("La verificación tardó demasiado. Por favor verifica tu conexión e inténtalo de nuevo.")),
          10000
        )
      );

      const { error } = await Promise.race([
        supabase.auth.verifyOtp({
          email: email || "",
          token: codigo.trim(),
          type: "recovery",
        }),
        timeoutPromise,
      ]);

      setLoading(false);

      if (error) {
        const nuevosIntentos = intentosFallidos + 1;
        setIntentosFallidos(nuevosIntentos);

        if (nuevosIntentos >= 5) {
          setBloqueadoHasta(Date.now() + 5 * 60 * 1000); // 5 minutos de bloqueo
          Alert.alert(
            "Acceso temporalmente bloqueado",
            "Has alcanzado el límite de 5 intentos fallidos. Por seguridad, la verificación se ha bloqueado durante 5 minutos."
          );
          return;
        }

        Alert.alert(
          "Código incorrecto",
          `${traducirErrorAuth(
            error,
            "El código OTP es inválido o ha expirado. Por favor solicita uno nuevo."
          )} (Intentos restantes: ${5 - nuevosIntentos})`
        );
        return;
      }

      setIntentosFallidos(0);
      setBloqueadoHasta(null);
      router.push("/recuperar-cuenta/nueva-contrasena");
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        "Error de verificación",
        err?.message || "No se pudo verificar el código. Verifica tu conexión a internet."
      );
    }
  };

  const handleReenviar = async () => {
    if (timer > 0 || reenviando) return;
    if (!email) {
      Alert.alert("Correo no encontrado", "No se encontró el correo electrónico para reenviar el código.");
      return;
    }

    setReenviando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setReenviando(false);

    if (error) {
      Alert.alert(
        "Error al reenviar",
        traducirErrorAuth(error, "No se pudo reenviar el código. Inténtalo más tarde.")
      );
      return;
    }

    Alert.alert("Código reenviado", "Se envió un nuevo código de verificación a tu correo.");
    setTimer(58);
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <EncabezadoLogo sinMargenSuperior />

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Verificar "}
            tituloDestacado="código"
            descripcion={`Hemos enviado un código de 6 dígitos a:\n${email || "tu correo"}`}
          />
        </View>

        <View style={styles.codeContainer}>
          <CampoCodigoVerificacion numeroDigitos={6} onChangeText={setCodigo} />

          <View style={styles.timerContainer}>
            <Ionicons
              name="time-outline"
              size={18}
              color="#2ECE79"
            />
            <Text style={styles.timerText}>
              {timer > 0
                ? `Reenviar código en 00:${timer.toString().padStart(2, "0")}`
                : "Ya puedes solicitar otro código"}
            </Text>
          </View>

          <BotonPrincipal
            titulo="Verificar código"
            cargando={loading}
            onPress={handleVerificar}
            disabled={loading || codigo.length < 6}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>¿No recibiste el código? </Text>
            <Pressable
              onPress={handleReenviar}
              disabled={timer > 0 || reenviando}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text
                style={[
                  styles.resendLink,
                  (timer > 0 || reenviando) && { opacity: 0.5 },
                ]}
              >
                {reenviando ? "Reenviando..." : "Reenviar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PiePaginaAutenticacion
          textoPregunta="¿No es tu correo?"
          textoEnlace="Cambiar"
          ruta="/recuperar-cuenta"
        />
      </View>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topSection: {
    gap: 4,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 26,
  },
  codeContainer: {
    gap: 20,
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  timerText: {
    color: "#C2D4CB",
    fontSize: 16,
    fontWeight: "500",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  resendText: {
    color: "#C2D4CB",
    fontSize: 16,
  },
  resendLink: {
    color: "#2ECE79",
    fontSize: 16,
    fontWeight: "800",
  },
  bottomContainer: {
    marginTop: 14,
    alignItems: "center",
  },
});
