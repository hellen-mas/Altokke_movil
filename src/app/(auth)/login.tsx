import {
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoLogo,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { BotonRedesSociales } from "@/components/ui/BotonRedesSociales";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { obtenerEstadoConductor } from "@/services/estadoConductor";

// Completo la sesion si vuelve de un navegador web
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [correoError, setCorreoError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSession = async (user: any) => {
    if (!user.user_metadata?.rol || !user.user_metadata?.dni) {
      Alert.alert(
        "¡Bienvenido!",
        "Completa tu registro seleccionando tu rol.",
        [
          {
            text: "Continuar",
            onPress: () => router.replace("/crear-cuenta"),
          },
        ]
      );
      return;
    }

    const rol = user.user_metadata.rol;

    if (rol === "conductor") {
      // Verificar la solicitud antes de permitir el acceso.
      await obtenerEstadoConductor(user.id);

      login("conductor");
      router.replace("/(auth)/estado-solicitud");
      return;
    }

    if (rol === "pasajero") {
      login("pasajero");
      router.replace("/mapa");
      return;
    }

    throw new Error("Rol de usuario no reconocido.");
  };

  const handleLogin = async () => {
    if (loading) return;

    Keyboard.dismiss();
    setCorreoError(false);

    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Ingresa tu correo y contraseña."
      );
      return;
    }

    const correoNormalizado = correo.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correoNormalizado)) {
      setCorreoError(true);
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: correoNormalizado,
          password: contrasena,
        });

      if (error) throw error;

      if (!data.user) {
        throw new Error("No se pudo obtener el usuario.");
      }

      await handleSession(data.user);
    } catch (error: any) {
      console.error("Error de login:", error);

      Alert.alert(
        "No se pudo iniciar sesión",
        traducirErrorAuth(
          error,
          "Comprueba tus datos e inténtalo nuevamente."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
        );

        if (res.type === "success") {
          const urlStr = res.url;
          const hashOrQuery = urlStr.split("#")[1] || urlStr.split("?")[1];
          if (hashOrQuery) {
            const params = new URLSearchParams(hashOrQuery);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (access_token && refresh_token) {
              const { data: sessionData, error: sessionError } =
                await supabase.auth.setSession({
                  access_token,
                  refresh_token,
                });

              if (sessionError) throw sessionError;

              if (sessionData?.session?.user) {
                await handleSession(sessionData.session.user);
              }
            }
          }
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Inicio con Google",
        traducirErrorAuth(err, "No se pudo iniciar sesión con Google. Por favor, inténtalo nuevamente.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTerms = () => {
    Alert.alert(
      "Términos de Servicio",
      "1. Uso del Servicio: Nuestra plataforma conecta a usuarios con opciones de transporte y movilidad de forma segura.\n2. Cuentas y Responsabilidad: Eres responsable de la veracidad de los datos registrados y del resguardo de tu cuenta.\n3. Seguridad y Convivencia: Nos reservamos el derecho de suspender cuentas que infrinjan las normas de seguridad de la comunidad.",
      [{ text: "Entendido", style: "default" }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Política de Privacidad",
      "Protegemos tu información:\n\n1. Recopilación: Solo recolectamos los datos necesarios (correo, nombre, viajes) para la prestación del servicio.\n2. Seguridad: Tus credenciales y datos viajan cifrados bajo estándares de alta seguridad.\n3. Derechos: Tienes control total sobre tu cuenta y puedes gestionar tus datos en cualquier momento.",
      [{ text: "Entendido", style: "default" }]
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <EncabezadoLogo sinMargenSuperior />

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Iniciar "}
            tituloDestacado="sesión"
            descripcion="Ingresa a tu cuenta para viajar por tu ciudad o generar ingresos."
          />
        </View>

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
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
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

        <View style={styles.socialButtonsContainer}>
          <BotonRedesSociales
            titulo="Continuar con Google"
            nombreIcono="logo-google"
            colorIcono="#EA4335"
            onPress={handleGoogleLogin}
            disabled={loading}
          />
        </View>
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
            <Text
              onPress={handleTerms}
              style={styles.legalLink}
            >
              Términos de servicio
            </Text>
            {" "}y{" "}
            <Text
              onPress={handlePrivacy}
              style={styles.legalLink}
            >
              Política de privacidad
            </Text>
            .
          </Text>
        </View>
      </View>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  topSection: {
    gap: 4,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  formContainer: {
    gap: 14,
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -2,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    color: "#2ECE79",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "right",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerText: {
    color: "#A8BCB2",
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    marginBottom: 16,
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
    color: "#A8BCB2",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  legalLink: {
    color: "#2ECE79",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
