import {
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { BotonRedesSociales } from "@/components/ui/BotonRedesSociales";
import { useAuth } from "@/context/AuthContext";
import { paletaColores } from "@/paletaColores";
import { authService } from "@/services/authService";
import { obtenerEstadoConductor } from "@/services/estadoConductor";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [correoError, setCorreoError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSession = async (user: any) => {
    const rol = user.user_metadata?.rol;
    if (!rol || !user.user_metadata?.dni) {
      return Alert.alert("¡Bienvenido!", "Completa tu registro seleccionando tu rol.", [
        { text: "Continuar", onPress: () => router.replace("/crear-cuenta") },
      ]);
    }

    if (rol === "conductor") {
      await obtenerEstadoConductor(user.id);
      login("conductor");
      return router.replace("/(auth)/estado-solicitud");
    }

    if (rol === "pasajero") {
      login("pasajero");
      return router.replace("/mapa");
    }

    throw new Error("Rol de usuario no reconocido.");
  };

  const handleLogin = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setCorreoError(false);

    const normalizado = correo.trim().toLowerCase();
    if (!normalizado || !contrasena.trim()) {
      return Alert.alert("Campos incompletos", "Ingresa tu correo y contraseña.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado)) {
      return setCorreoError(true);
    }

    setLoading(true);
    try {
      const user = await authService.loginConPassword(normalizado, contrasena);
      await handleSession(user);
    } catch (error: any) {
      Alert.alert("No se pudo iniciar sesión", traducirErrorAuth(error, "Comprueba tus datos e inténtalo nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const user = await authService.loginConGoogle();
      if (user) await handleSession(user);
    } catch (err: any) {
      Alert.alert("Inicio con Google", traducirErrorAuth(err, "No se pudo iniciar sesión con Google."));
    } finally {
      setLoading(false);
    }
  };


  const handleTerms = () =>
    Alert.alert(
      "Términos de Servicio",
      "1. Uso del Servicio: Conectamos pasajeros y conductores de forma ágil y segura.\n2. Seguridad: Tus datos viajan protegidos.\n3. Convivencia: Cuentas que violen normas serán suspendidas."
    );

  const handlePrivacy = () =>
    Alert.alert(
      "Política de Privacidad",
      "Protegemos tus datos personales y credenciales bajo altos estándares de cifrado y seguridad."
    );

  return (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <ContenedorPantalla
        estilo={{ backgroundColor: "transparent" }}
        estiloContenedorContenido={styles.scrollContent}
      >
        <View style={styles.topSection}>
          <EncabezadoPagina
            titulo="Iniciar "
            tituloDestacado="sesión"
            descripcion="Ingresa a tu cuenta para viajar por tu ciudad o generar ingresos."
          />

          <View style={styles.formContainer}>
            <CampoTexto
              nombreIcono="mail-outline"
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={correo}
              onChangeText={setCorreo}
              error={correoError}
              textoError={correoError ? "Ingresa un correo electrónico válido" : undefined}
            />

            <CampoTexto
              nombreIcono="lock-closed-outline"
              placeholder="Contraseña"
              esPassword
              autoComplete="password"
              textContentType="password"
              value={contrasena}
              onChangeText={setContrasena}
            />

            <Pressable
              onPress={() => router.push("/recuperar-cuenta")}
              hitSlop={12}
              accessibilityRole="link"
              accessibilityLabel="¿Olvidaste tu contraseña? Toca para recuperarla"
              style={({ pressed }) => [styles.forgotPassword, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <BotonPrincipal
              titulo="Iniciar sesión"
              cargando={loading}
              onPress={handleLogin}
              disabled={loading}
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.divider} />
          </View>

          <BotonRedesSociales
            titulo="Continuar con Google"
            nombreIcono="logo-google"
            colorIcono="#EA4335"
            onPress={handleGoogleLogin}
            disabled={loading}
          />
        </View>

        <View style={styles.bottomContainer}>
          <PiePaginaAutenticacion
            textoPregunta="¿No tienes una cuenta?"
            textoEnlace="Crear cuenta"
            ruta="/crear-cuenta"
          />

          <View style={styles.legalContainer}>
            <Text style={styles.disclaimerText}>
              Al iniciar sesión, aceptas nuestros{" "}
              <Text onPress={handleTerms} style={styles.legalLink}>Términos de servicio</Text>
              {" "}y{" "}
              <Text onPress={handlePrivacy} style={styles.legalLink}>Política de privacidad</Text>.
            </Text>
          </View>
        </View>
      </ContenedorPantalla>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  topSection: {
    gap: 16,
  },
  formContainer: {
    gap: 14,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    color: paletaColores.primary,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "right",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerText: {
    color: paletaColores.textSecondary,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  bottomContainer: {
    marginTop: "auto",
    paddingTop: 12,
    gap: 10,
    alignItems: "center",
  },
  legalContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  disclaimerText: {
    color: paletaColores.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  legalLink: {
    color: paletaColores.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
