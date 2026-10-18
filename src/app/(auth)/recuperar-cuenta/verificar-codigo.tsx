import {
  BotonPrincipal,
  CampoCodigoVerificacion,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { authService } from "@/services/authService";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerificar = async () => {
    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      const seg = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      Alert.alert("Demasiados intentos", `Por seguridad, espera ${seg} segundos antes de volver a intentar.`);
      return;
    }
    if (codigo.length < 6) {
      Alert.alert("Código incompleto", "Por favor ingresa el código completo de 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      await authService.verificarCodigoRecuperacion(email || "", codigo);
      router.push("/recuperar-cuenta/nueva-contrasena");
    } catch (error: any) {
      const nuevos = intentosFallidos + 1;
      setIntentosFallidos(nuevos);
      if (nuevos >= 5) {
        setBloqueadoHasta(Date.now() + 5 * 60 * 1000);
        Alert.alert("Acceso bloqueado", "Has alcanzado el límite de 5 intentos fallidos. Espera 5 minutos.");
        return;
      }
      Alert.alert(
        "Código incorrecto",
        `${traducirErrorAuth(error, "El código es inválido o ha expirado.")} (Intentos restantes: ${5 - nuevos})`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    if (timer > 0 || reenviando || !email) return;
    setReenviando(true);
    try {
      await authService.solicitarRecuperacionPassword(email);
      Alert.alert("Código reenviado", "Se envió un nuevo código de verificación a tu correo.");
      setTimer(58);
    } catch (error: any) {
      Alert.alert("Error al reenviar", traducirErrorAuth(error, "No se pudo reenviar el código."));
    } finally {
      setReenviando(false);
    }
  };


  return (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
        <View style={styles.topSection}>
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
              <Ionicons name="time-outline" size={18} color={paletaColores.boton} />
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
                <Text style={[styles.resendLink, (timer > 0 || reenviando) && { opacity: 0.5 }]}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
    color: paletaColores.boton,
    fontSize: 16,
    fontWeight: "800",
  },
  bottomContainer: {
    marginTop: 14,
    alignItems: "center",
  },
});

