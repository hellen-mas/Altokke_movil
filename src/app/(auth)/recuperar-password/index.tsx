import { paletaColores } from "@/paletaColores";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View, KeyboardAvoidingView, ScrollView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CampoTexto, EncabezadoLogo, EncabezadoPagina, BotonPrincipal, ContenedorPantalla } from "@/components/ui";

export default function RecuperarPasswordScreen() {
  const [correo, setCorreo] = useState("");

  const handleContinuar = () => {
    if (!correo.trim()) {
      Alert.alert(
        "Campo incompleto",
        "Por favor, ingresa tu correo electrónico o teléfono."
      );
      return;
    }
    router.push(`/recuperar-password/verificar?email=${encodeURIComponent(correo)}`);
  };

  return (
    <ContenedorPantalla contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <EncabezadoLogo />

            <EncabezadoPagina
              title={"Recuperar\ncontraseña"}
              highlightedTitle=""
              description=""
            />

            <View style={styles.inputContainer}>
              <CampoTexto
                iconName="mail-outline"
                placeholder="Correo electrónico o teléfono"
                keyboardType="email-address"
                autoCapitalize="none"
                value={correo}
                onChangeText={setCorreo}
              />
            </View>

            <BotonPrincipal
              title="Continuar"
              onPress={handleContinuar}
              style={styles.button}
            />

            <Link href={"/login"} style={styles.secondaryLink}>
              Usa otra forma de recuperación
            </Link>
          </View>

          <View style={styles.footer}>
            <Link href={"/login"} style={styles.secondaryLink}>
              Volver al inicio
            </Link>
          </View>
    </ContenedorPantalla>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginTop: 30,
    marginBottom: 40,
  },
  button: {
    marginBottom: 30,
  },
  secondaryLink: {
    color: paletaColores.verde,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  footer: {
    paddingBottom: 40,
    alignItems: "center",
    marginTop: "auto",
  },
});
