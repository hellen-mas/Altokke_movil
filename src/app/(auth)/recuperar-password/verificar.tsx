import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoHeader, OTPCodeField, PrimaryButton } from "@/components/ui";
import { paletaColores } from "@/paletaColores";

export default function VerificacionCodigoScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <LogoHeader />
            <Text style={styles.title}>Verificar cuenta</Text>
            <Text style={styles.subtitle}>
              Se ha enviado un código de 6 dígitos a{"\n"}jperez@email.com
            </Text>
            <OTPCodeField numberOfDigits={6} />
            <View style={styles.timerContainer}>
              <Ionicons
                name="time-outline"
                size={16}
                color={paletaColores.textoSecundario}
              />
              <Text style={styles.timerText}>Reenviar código en 00:58</Text>
            </View>
            <PrimaryButton
              title="Verificar"
              onPress={() => router.push("/recuperar-password/nuevo" as any)}
              style={styles.verifyButton}
            />
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>¿No recibiste el código? </Text>
              <Link href={"/login" as any} asChild>
                <Pressable>
                  <Text style={styles.resendLink}>Reenviar</Text>
                </Pressable>
              </Link>
            </View>
            <View style={styles.footerContainer}>
              <Link href={"/login" as any} asChild>
                <Pressable>
                  <Text style={styles.footerText}>Volver al inicio</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
