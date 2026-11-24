import {
  AvisoLegalTerminos,
  BotonPrincipal,
  BotonRedesSociales,
  CampoTextoHookForm,
  ContenedorPantalla,
  EncabezadoPagina,
  PiePaginaAutenticacion,
  SeparadorConTexto,
} from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useLoginSession } from "@/features/autenticacion/hooks/useLoginSession";
import { esquemaLogin, TipoDatosLogin } from "@/features/autenticacion/utils/validacionesAuth";
import { yupResolver } from "@hookform/resolvers/yup";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { useForm } from "react-hook-form";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colores, esOscuro } = useAltokkeTheme();
  const { loading, iniciarSesionCorreo, iniciarSesionGoogle, iniciarSesionApple } = useLoginSession();
  const { control, handleSubmit } = useForm<TipoDatosLogin>({
    resolver: yupResolver(esquemaLogin),
    defaultValues: { correo: "", contrasena: "" },
  });

  return (
    <ContenedorPantalla estilo={{ backgroundColor: colores.fondo }} estiloContenedorContenido={[styles.scroll, { backgroundColor: colores.fondo }]}>
      <EncabezadoPagina titulo="Iniciar " tituloDestacado="sesión" descripcion="Ingresa a tu cuenta para viajar por tu ciudad o generar ingresos." />
      <View style={styles.topSection}>
        <View style={styles.form}>
          <CampoTextoHookForm control={control} name="correo" conBotonLimpiar nombreIcono="mail-outline" placeholder="Correo electrónico" keyboardType="email-address" autoCapitalize="none" />
          <CampoTextoHookForm control={control} name="contrasena" nombreIcono="lock-closed-outline" placeholder="Contraseña" esPassword autoCapitalize="none" />
          <Pressable onPress={() => router.push("/recuperar-cuenta")} hitSlop={12} accessibilityRole="link" style={({ pressed }) => [styles.forgot, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.forgotText, { color: colores.exitoTexto }]}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
          <BotonPrincipal titulo="Iniciar sesión" mostrarIcono icono="arrow-forward" cargando={loading} onPress={handleSubmit(iniciarSesionCorreo)} disabled={loading} />
        </View>
        <SeparadorConTexto texto="O continúa con" />
        <BotonRedesSociales titulo="Continuar con Google" nombreIcono="logo-google" colorIcono="#EA4335" onPress={iniciarSesionGoogle} disabled={loading} />
        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              esOscuro
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={12}
            style={styles.botonApple}
            onPress={iniciarSesionApple}
          />
        )}
      </View>
      <View style={styles.bottom}>
        <PiePaginaAutenticacion textoPregunta="¿No tienes una cuenta?" textoEnlace="Crear cuenta" ruta="/crear-cuenta" />
        <Pressable
          onPress={() => router.push("/reclamaciones")}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="Libro de Reclamaciones"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 0.85, marginTop: 4 }]}
        >
          <Text style={{ fontSize: 13, color: colores.secundario, textDecorationLine: "underline" }}>
            Libro de Reclamaciones
          </Text>
        </Pressable>
        <AvisoLegalTerminos />
      </View>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  topSection: { marginTop: 32, gap: 20 },
  form: { gap: 14 },
  forgot: { alignSelf: "flex-end", paddingVertical: 5, paddingHorizontal: 4 },
  forgotText: { fontSize: 16, fontWeight: "600" },
  botonApple: { width: "100%", height: 50 },
  bottom: { marginTop: "auto", paddingTop: 32, paddingBottom: 8, gap: 12, alignItems: "center" },
});
