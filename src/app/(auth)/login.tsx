import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { BotonRedesSociales } from "@/components/ui/BotonRedesSociales";
import { useAuth } from "@/context/AuthContext";
import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
import { authService } from "@/services/authService";
import { obtenerEstadoConductor } from "@/services/estadoConductor";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { esquemaLogin, TipoDatosLogin } from "@/utils/validaciones";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colores } = useAltokkeTheme();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit } = useForm<TipoDatosLogin>({
    resolver: yupResolver(esquemaLogin),
    defaultValues: { correo: "", contrasena: "" },
  });
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

  // handleSubmit solo llama a esta función si los datos pasan esquemaLogin
  const handleLogin = async ({ correo, contrasena }: TipoDatosLogin) => {
    if (loading) return;
    Keyboard.dismiss();

    setLoading(true);
    try {
      const user = await authService.loginConPassword(correo, contrasena);
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
      <ContenedorPantalla
        estilo={{ backgroundColor: colores.fondo }}
        estiloContenedorContenido={[
          styles.scrollContent,
          { backgroundColor: colores.fondo },
        ]}
      >
        <View style={styles.topSection}>
          <EncabezadoPagina
            titulo="Iniciar "
            tituloDestacado="sesión"
            descripcion="Ingresa a tu cuenta para viajar por tu ciudad o generar ingresos."
          />

          <View style={styles.formContainer}>
            <CampoTextoHookForm
              control={control}
              name="correo"
              nombreIcono="mail-outline"
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />

            <CampoTextoHookForm
              control={control}
              name="contrasena"
              nombreIcono="lock-closed-outline"
              placeholder="Contraseña"
              esPassword
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
            />

            <Pressable
              onPress={() => router.push("/recuperar-cuenta")}
              hitSlop={12}
              accessibilityRole="link"
              accessibilityLabel="¿Olvidaste tu contraseña? Toca para recuperarla"
              style={({ pressed }) => [styles.forgotPassword, pressed && { opacity: 0.6 }]}
            >
              <Text 
                style={[
                  styles.forgotPasswordText,
                  { color: colores.exitoTexto },
                ]}
              >¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <BotonPrincipal
              titulo="Iniciar sesión"
              mostrarIcono
              icono="arrow-forward"
              cargando={loading}
              onPress={handleSubmit(handleLogin)}
              disabled={loading}
            />
          </View>

          <View style={styles.dividerContainer}>
            <View 
              style={[
                styles.divider,
                { backgroundColor: colores.linea },
              ]}
            />
            <Text style={[styles.dividerText, { color: colores.secundario },]}>O continúa con</Text>
            <View style={[styles.divider, { backgroundColor: colores.linea },]} />
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
            <Text style={[styles.disclaimerText, { color: colores.secundario }, ]}>
              Al iniciar sesión, aceptas nuestros{" "}
              <Text onPress={handleTerms} style={[styles.legalLink, { color: colores.exitoTexto },]}>Términos de servicio</Text>
              {" "}y{" "}
              <Text onPress={handlePrivacy} style={[styles.legalLink, { color: colores.exitoTexto },]}>Política de privacidad</Text>.
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  topSection: {
    gap: 24,
  },
  formContainer: {
    gap: 14,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: "500",
  },
  bottomContainer: {
    marginTop: "auto",
    paddingTop: 28,
    gap: 8,
    alignItems: "center",
  },
  legalContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
  legalLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
