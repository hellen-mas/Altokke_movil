import {
  BotonPrincipal,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
} from "@/shared/components/ui";
import { PiePaginaAutenticacion } from "@/features/autenticacion/components";
import { BotonRedesSociales } from "@/shared/components/ui/BotonRedesSociales";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { authService } from "@/features/autenticacion/services/authService";
import { obtenerEstadoConductor } from "@/features/conductores/services/conductorService";
import { traducirErrorAuth } from "@/features/autenticacion/utils/erroresAuth";
import { esquemaLogin, TipoDatosLogin } from "@/features/autenticacion/utils/validacionesAuth";
import { yupResolver } from "@hookform/resolvers/yup";
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

    login(rol);
    if (rol === "conductor") {
      await obtenerEstadoConductor(user.id);
      return router.replace("/(auth)/estado-solicitud");
    }
    return router.replace("/mapa");
  };

  const ejecutarAuth = async (accion: () => Promise<any>) => {
    if (loading) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const user = await accion();
      if (user) await handleSession(user);
    } catch (err: any) {
      Alert.alert("Inicio de sesión", traducirErrorAuth(err, "Comprueba tus datos e inténtalo nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContenedorPantalla
      estilo={{ backgroundColor: colores.fondo }}
      estiloContenedorContenido={[styles.scrollContent, { backgroundColor: colores.fondo }]}
    >
      <EncabezadoPagina
        titulo="Iniciar "
        tituloDestacado="sesión"
        descripcion="Ingresa a tu cuenta para viajar por tu ciudad o generar ingresos."
      />

      <View style={styles.topSection}>
        <View style={styles.formContainer}>
          <CampoTextoHookForm
            control={control}
            name="correo"
            conBotonLimpiar
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
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            accessibilityRole="link"
            accessibilityLabel="¿Olvidaste tu contraseña? Toca para recuperarla"
            style={({ pressed }) => [styles.forgotPassword, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.forgotPasswordText, { color: colores.exitoTexto }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <BotonPrincipal
            titulo="Iniciar sesión"
            mostrarIcono
            icono="arrow-forward"
            cargando={loading}
            onPress={handleSubmit(({ correo, contrasena }) =>
              ejecutarAuth(() => authService.loginConPassword(correo, contrasena))
            )}
            disabled={loading}
          />
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colores.linea }]} />
          <Text style={[styles.dividerText, { color: colores.secundario }]}>O continúa con</Text>
          <View style={[styles.divider, { backgroundColor: colores.linea }]} />
        </View>

        <BotonRedesSociales
          titulo="Continuar con Google"
          nombreIcono="logo-google"
          colorIcono="#EA4335"
          onPress={() => ejecutarAuth(() => authService.loginConGoogle())}
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
          <Text style={[styles.disclaimerText, { color: colores.secundario }]}>
            Al iniciar sesión, aceptas nuestros{" "}
            <Text
              onPress={() =>
                Alert.alert(
                  "Términos de Servicio",
                  "1. Uso del Servicio: Conectamos pasajeros y conductores de forma ágil y segura.\n2. Seguridad: Tus datos viajan protegidos.\n3. Convivencia: Cuentas que violen normas serán suspendidas."
                )
              }
              style={[styles.legalLink, { color: colores.exitoTexto }]}
            >
              Términos de servicio
            </Text>
            {" "}y{" "}
            <Text
              onPress={() =>
                Alert.alert(
                  "Política de Privacidad",
                  "Protegemos tus datos personales y credenciales bajo altos estándares de cifrado y seguridad."
                )
              }
              style={[styles.legalLink, { color: colores.exitoTexto }]}
            >
              Política de privacidad
            </Text>.
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
    flex: 1,
    justifyContent: "center",
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
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1.5,
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
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  legalLink: {
    fontWeight: "700",
  },
});
