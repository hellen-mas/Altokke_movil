import {
  BotonPrincipal,
  CampoCodigoVerificacion,
  ContenedorPantalla,
  EncabezadoPagina,
} from "@/shared/components/ui";
import { PiePaginaAutenticacion } from "@/features/autenticacion/components";
import { paletaColores } from "@/shared/theme/paletaColores";
import { authService } from "@/features/autenticacion/services/authService";
import { useCountdown } from "@/features/autenticacion/hooks/useCountdown";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function VerificacionCodigoScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number | null>(null);

  const { segundos, activo, reiniciar } = useCountdown(58);

  const handleVerificar = async () => {
    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      const s = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
      return Alert.alert("Demasiados intentos", `Por seguridad, espera ${s} segundos antes de reintentar.`);
    }
    if (codigo.length < 6) {
      return Alert.alert("Código incompleto", "Ingresa el código completo de 6 dígitos.");
    }

    setLoading(true);
    try {
      await authService.verificarCodigoRecuperacion(email || "", codigo);
      router.push("/recuperar-cuenta/nueva-contrasena");
    } catch (error: any) {
      const prox = intentos + 1;
      setIntentos(prox);
      if (prox >= 5) {
        setBloqueadoHasta(Date.now() + 5 * 60 * 1000);
        return Alert.alert("Acceso bloqueado", "Has alcanzado el límite de 5 intentos. Espera 5 minutos.");
      }
      Alert.alert("Código incorrecto", `${traducirErrorAuth(error)} (Intentos restantes: ${5 - prox})`);
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    if (activo || reenviando || !email) return;
    setReenviando(true);
    try {
      await authService.solicitarRecuperacionPassword(email);
      Alert.alert("Código reenviado", "Se envió un nuevo código de verificación a tu correo.");
      reiniciar(58);
    } catch (error: any) {
      Alert.alert("Error al reenviar", traducirErrorAuth(error));
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
          <EncabezadoPagina
            titulo="Verificar "
            tituloDestacado="código"
            descripcion={`Hemos enviado un código de 6 dígitos a:\n${email || "tu correo"}`}
          />

          <View style={styles.codeContainer}>
            <CampoCodigoVerificacion numeroDigitos={6} onChangeText={setCodigo} />

            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={18} color={paletaColores.boton} />
              <Text style={styles.timerText}>
                {activo
                  ? `Reenviar código en 00:${segundos.toString().padStart(2, "0")}`
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
              <Pressable onPress={handleReenviar} disabled={activo || reenviando} hitSlop={12}>
                <Text style={[styles.resendLink, (activo || reenviando) && { opacity: 0.5 }]}>
                  {reenviando ? "Reenviando..." : "Reenviar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <PiePaginaAutenticacion textoPregunta="¿No es tu correo?" textoEnlace="Cambiar" ruta="/recuperar-cuenta" />
        </View>
      </ContenedorPantalla>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, flexGrow: 1, justifyContent: "space-between" },
  topSection: { gap: 20 },
  codeContainer: { gap: 16, alignItems: "center" },
  timerContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  timerText: { fontSize: 13, color: paletaColores.textoSecundario, fontWeight: "500" },
  resendContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  resendText: { fontSize: 13, color: paletaColores.textoSecundario },
  resendLink: { fontSize: 13, color: paletaColores.boton, fontWeight: "600" },
  bottomContainer: { marginTop: "auto", paddingTop: 16 },
});
