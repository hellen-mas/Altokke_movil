import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, View, KeyboardAvoidingView, ScrollView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EncabezadoLogo, CampoCodigoVerificacion, BotonPrincipal, ContenedorPantalla } from "@/components/ui";
import { paletaColores } from "@/paletaColores";

import { useLocalSearchParams } from "expo-router";

export default function VerificacionCodigoScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codigo, setCodigo] = useState("");
  const [timer, setTimer] = useState(58);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerificar = () => {
    if (codigo.length < 6) {
      Alert.alert(
        "Código incompleto",
        "Por favor, ingresa el código completo de 6 dígitos."
      );
      return;
    }
    if (codigo !== "123456") {
      Alert.alert(
        "Código incorrecto",
        "El código OTP ingresado no es válido."
      );
      return;
    }
    router.push("/recuperar-password/nuevo");
  };

  const handleReenviar = () => {
    if (timer === 0) {
      setTimer(58);
      // Logic to resend code goes here
    }
  };

  return (
    <ContenedorPantalla contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <EncabezadoLogo />
            <Text style={styles.title}>Verificar cuenta</Text>
            <Text style={styles.subtitle}>
              Se ha enviado un código de 6 dígitos a{"\n"}
              {email || "tu correo electrónico"}
            </Text>
            <CampoCodigoVerificacion 
              numberOfDigits={6} 
              onTextChange={setCodigo} 
            />
            <View style={styles.timerContainer}>
              <Ionicons
                name="time-outline"
                size={16}
                color={paletaColores.textoSecundario}
              />
              <Text style={styles.timerText}>
                {timer > 0 ? `Reenviar código en 00:${timer.toString().padStart(2, '0')}` : "Puedes reenviar el código"}
              </Text>
            </View>
            <BotonPrincipal
              title="Verificar"
              onPress={handleVerificar}
              style={styles.verifyButton}
            />
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>¿No recibiste el código? </Text>
              <Pressable onPress={handleReenviar} disabled={timer > 0}>
                <Text style={[styles.resendLink, timer > 0 && { opacity: 0.5 }]}>Reenviar</Text>
              </Pressable>
            </View>
            <View style={styles.footerContainer}>
              <Link href={"/login"} asChild>
                <Pressable>
                  <Text style={styles.footerText}>Volver al inicio</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: paletaColores.texto,
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: paletaColores.texto,
    marginBottom: 10,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 40,
    gap: 6,
  },
  timerText: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
  },
  verifyButton: {
    marginTop: 10,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  resendText: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
  },
  resendLink: {
    color: paletaColores.verde,
    fontSize: 14,
    fontWeight: "600",
  },
  footerContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 40,
    marginTop: 40,
  },
  footerText: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
    fontWeight: "500",
  },
});
