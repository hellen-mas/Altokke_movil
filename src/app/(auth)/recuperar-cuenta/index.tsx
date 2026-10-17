import {
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoLogo,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { traducirErrorAuth } from "@/utils/erroresAuth";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function RecuperarPasswordScreen() {
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinuar = async () => {
    if (!correo.trim()) {
      Alert.alert(
        "Campo incompleto",
        "Por favor, ingresa tu correo electrónico para continuar.",
      );
      return;
    }

    const correoNormalizado = correo.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoNormalizado)) {
      Alert.alert(
        "Correo inválido",
        "Por favor, ingresa un correo electrónico válido.",
      );
      return;
    }

    setLoading(true);

    // Pido a Supabase el envío del código OTP para restablecer la contraseña
    const { error } = await supabase.auth.resetPasswordForEmail(correoNormalizado);

    setLoading(false);

    if (error) {
      Alert.alert(
        "Error al enviar código",
        traducirErrorAuth(
          error,
          "No se pudo enviar el código. Revisa que el correo esté registrado e inténtalo nuevamente."
        )
      );
      return;
    }

    // Envío el correo como parámetro codificado
    router.push(
      `/recuperar-cuenta/verificar-codigo?email=${encodeURIComponent(correoNormalizado)}`,
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.topSection}>
        <EncabezadoLogo sinMargenSuperior />

        <View style={styles.headerContainer}>
          <EncabezadoPagina
            titulo={"Recuperar "}
            tituloDestacado="cuenta"
            descripcion="Ingresa tu correo para recibir un código de recuperación."
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
          />

          <BotonPrincipal
            titulo="Continuar"
            cargando={loading}
            onPress={handleContinuar}
            disabled={loading}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PiePaginaAutenticacion
          textoPregunta="¿Recordaste tu contraseña?"
          textoEnlace="Iniciar sesión"
          ruta="/login"
        />
      </View>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topSection: {
    gap: 4,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 26,
  },
  formContainer: {
    gap: 24,
    marginBottom: 24,
  },
  bottomContainer: {
    marginTop: 10,
    alignItems: "center",
  },
});
