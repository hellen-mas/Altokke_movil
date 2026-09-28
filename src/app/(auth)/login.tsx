import {
  BotonPrincipal,
  BotonRedesSociales,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoLogo,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { USUARIOS_DEMO } from "@/constants/usuarios";
import { useAuth } from "@/context/AuthContext";
import { paletaColores } from "@/paletaColores";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

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

    login(usuario.rol as "pasajero" | "conductor");

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
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <EncabezadoLogo />

      <View style={styles.headerContainer}>
        <EncabezadoPagina
          titulo={"Iniciar sesión\nen "}
          tituloDestacado="Altokke"
          descripcion={"Accede a tu cuenta y sigue\nmoviendo tu ciudad."}
        />
      </View>

      <View style={styles.formContainer}>
        <CampoTexto
          nombreIcono="mail-outline"
          textoReferencia="Correo electrónico o teléfono"
          keyboardType="email-address"
          autoCapitalize="none"
          valor={correo}
          alCambiarTexto={setCorreo}
          error={correoError}
        />

        <CampoTexto
          nombreIcono="lock-closed-outline"
          textoReferencia="Contraseña"
          esPassword
          valor={contrasena}
          alCambiarTexto={setContrasena}
        />

        <Link href={"/recuperar-password"} style={styles.forgotPassword}>
          ¿Olvidaste tu contraseña?
        </Link>

        <BotonPrincipal titulo="Entrar" alPresionar={handleLogin} />
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>O continúa con</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialButtonsContainer}>
        <BotonRedesSociales
          titulo="Continuar con Google"
          nombreIcono="logo-google"
          colorIcono="#EA4335"
        />
        <BotonRedesSociales
          titulo="Continuar con Apple"
          nombreIcono="logo-apple"
          colorIcono={paletaColores.texto}
        />
      </View>

      <View style={styles.footerContainer}>
        <PiePaginaAutenticacion
          textoPregunta="¿No tienes una cuenta?"
          textoEnlace="Crear cuenta"
          ruta={"/crear-cuenta"}
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
    marginTop: 20,
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
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  socialButtonText: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    marginTop: "auto",
    marginBottom: 24,
  },
  disclaimerText: {
    color: paletaColores.textoSecundario,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
