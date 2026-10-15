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
import { paletaColores } from "@/paletaColores";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
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
    try {
      // Usuario de Google que todavía no completó su registro
      if (!user.user_metadata?.rol || !user.user_metadata?.dni) {
        Alert.alert(
          "¡Bienvenido a Altokke!",
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
        // Consultar primero el estado real en Supabase
        await dirigirConductor(user.id);
        login("conductor");
        return;
      }

      if (rol === "pasajero") {
        login("pasajero");
        router.replace("/mapa");
        return;
      }

      throw new Error("Rol de usuario no reconocido.");

    } catch (error: any) {
      console.error("Error al verificar acceso:", error);

      Alert.alert(
        "No se pudo verificar tu cuenta",
        error.message ||
          "Intenta nuevamente en unos momentos."
      );
    }
  };

  const handleLogin = async () => {
    if (loading) return;

    setCorreoError(false);

    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Ingresa tu correo y contraseña."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correo.trim())) {
      setCorreoError(true);
      return;
    }

    setLoading(true);

    try {
      console.log("Iniciando sesión...");

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: correo.trim(),
          password: contrasena,
        });

      if (error) throw error;

      if (!data.user) {
        throw new Error("No se pudo obtener el usuario.");
      }

      console.log("Sesión iniciada correctamente");

      await handleSession(data.user);

    } catch (error: any) {
      console.error("ERROR LOGIN:", error);

      Alert.alert(
        "No se pudo iniciar sesión",
        error.message || "Intenta nuevamente."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
    } catch {
      Alert.alert("Error", "No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  const dirigirConductor = async (
      usuarioId: string
    ) => {
      console.log("Consultando estado del conductor...");
      const estado = await obtenerEstadoConductor(usuarioId);
      console.log("Estado del conductor:", estado);
      router.replace("/(auth)/estado-solicitud");
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
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={correo}
          onChangeText={setCorreo}
          error={correoError}
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

        <Link href={"/recuperar-cuenta"} style={styles.forgotPassword}>
          ¿Olvidaste tu contraseña?
        </Link>

        <BotonPrincipal
          titulo={loading ? "Entrando..." : "Entrar"}
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
        />
      </View>

      <View style={styles.footerContainer}>
        <PiePaginaAutenticacion
          textoPregunta="¿No tienes una cuenta?"
          textoEnlace="Crear cuenta"
          ruta={"/crear-cuenta"}
          mostrarBorde={false}
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
    fontSize: 16,
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
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  footerContainer: {
    marginTop: "auto",
    marginBottom: 24,
  },
  disclaimerText: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
