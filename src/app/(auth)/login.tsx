import {
  PiePaginaAutenticacion,
  CampoTexto,
  EncabezadoLogo,
  EncabezadoPagina,
  BotonPrincipal,
  BotonRedesSociales,
  ContenedorPantalla,
} from "@/components/ui";
import { USUARIOS_DEMO } from "@/constants/usuarios";
import { paletaColores } from "@/paletaColores";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [correoError, setCorreoError] = useState(false);
  const { login } = useAuth();

  const handleLogin = () => {
    setCorreoError(false);
    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Por favor, ingresa tu correo y contraseña para continuar.",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      setCorreoError(true);
      return;
    }

    const usuario = USUARIOS_DEMO.find(
      (u) =>
        u.correo.toLowerCase() === correo.trim().toLowerCase() &&
        u.password === contrasena,
    );

    if (!usuario) {
      Alert.alert(
        "Credenciales incorrectas",
        "El correo o la contraseña no son correctos.",
      );
      return;
    }

    login();

    if (usuario.rol === "conductor") {
      router.replace("/inicio");
      return;
    }

    if (usuario.rol === "pasajero") {
      router.replace("/mapa");
      return;
    }
  };

  return (
    <ContenedorPantalla contentContainerStyle={styles.scrollContent}>
        <EncabezadoLogo />

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            title={"Iniciar sesión\nen "}
            highlightedTitle="Altokke"
            description={"Accede a tu cuenta y sigue\nmoviendo tu ciudad."}
          />
        </View>

        <View style={styles.formContainer}>
          <CampoTexto
            iconName="mail-outline"
            placeholder="Correo electrónico o teléfono"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
            error={correoError}
          />

          <CampoTexto
            iconName="lock-closed-outline"
            placeholder="Contraseña"
            isPassword
            value={contrasena}
            onChangeText={setContrasena}
          />

          <Link
            href={"/recuperar-password"}
            style={styles.forgotPassword}
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <BotonPrincipal title="Entrar" onPress={handleLogin} />
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>O continúa con</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <BotonRedesSociales
            title="Continuar con Google"
            iconName="logo-google"
            iconColor="#EA4335"
          />

          <BotonRedesSociales
            title="Continuar con Apple"
            iconName="logo-apple"
            iconColor="#FFFFFF"
          />
        </View>

        <View style={styles.footerContainer}>
          <PiePaginaAutenticacion
            questionText="¿No tienes una cuenta?"
            linkText="Crear cuenta"
            href={"/crear-cuenta"}
          />
        </View>

        <Text style={styles.disclaimerText}>
          Al iniciar sesión, aceptas nuestros{"\n"}
          Términos de servicio y Política de privacidad.
        </Text>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
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
