import {
  AuthFooter,
  CustomInput,
  LogoHeader,
  PageHeader,
  PrimaryButton,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleLogin = () => {
    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Por favor, ingresa tu correo y contraseña para continuar."
      );
      return;
    }
    
    Alert.alert("Éxito", "Iniciando sesión...");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <LogoHeader />

        <View style={styles.headerContainer}>
          <PageHeader
            title={"Iniciar sesión\nen "}
            highlightedTitle="Altokke"
            description={"Accede a tu cuenta y sigue\nmoviendo tu ciudad."}
          />
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            iconName="mail-outline"
            placeholder="Correo electrónico o teléfono"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
          />

          <CustomInput
            iconName="lock-closed-outline"
            placeholder="Contraseña"
            isPassword
            value={contrasena}
            onChangeText={setContrasena}
          />

          <Link
            href={"/recuperar-password" as any}
            style={styles.forgotPassword}
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <PrimaryButton title="Entrar" onPress={handleLogin} />
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>O continúa con</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <Pressable style={styles.socialButton}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.socialButtonText}>Continuar con Google</Text>
          </Pressable>

          <Pressable style={styles.socialButton}>
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.socialButtonText}>Continuar con Apple</Text>
          </Pressable>
        </View>

        <View style={styles.footerContainer}>
          <AuthFooter
            questionText="¿No tienes una cuenta?"
            linkText="Crear cuenta"
            href={"/crear-cuenta" as any}
          />
        </View>

        <Text style={styles.disclaimerText}>
          Al iniciar sesión, aceptas nuestros{"\n"}
          Términos de servicio y Política de privacidad.
        </Text>
      </KeyboardAwareScrollView>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 40,
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  forgotPassword: {
    color: paletaColores.verde,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: paletaColores.borde,
  },
  dividerText: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  socialButtonText: {
    color: paletaColores.texto,
    fontSize: 13,
    fontWeight: "500",
  },
  footerContainer: {
    marginBottom: 24,
  },
  disclaimerText: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
