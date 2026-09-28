import {
  BotonPrincipal,
  CampoTexto,
  ContenedorPantalla,
  EncabezadoLogo,
  EncabezadoPagina,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export default function RecuperarPasswordScreen() {
  const [correo, setCorreo] = useState("");

  const handleContinuar = () => {
    if (!correo.trim()) {
      Alert.alert(
        "Campo incompleto",
        "Por favor, ingresa tu correo electrónico o teléfono.",
      );
      return;
    }
    router.push(
      `/recuperar-password/verificar?email=${encodeURIComponent(correo)}`,
    );
  };

  return (
    <ContenedorPantalla estiloContenedorContenido={styles.scrollContent}>
      <View style={styles.content}>
        <EncabezadoLogo />

        <EncabezadoPagina
          titulo={"Recuperar\ncontraseña"}
          tituloDestacado=""
          descripcion=""
        />

        <View style={styles.inputContainer}>
          <CampoTexto
            nombreIcono="mail-outline"
            textoReferencia="Correo electrónico o teléfono"
            keyboardType="email-address"
            autoCapitalize="none"
            valor={correo}
            alCambiarTexto={setCorreo}
          />
        </View>

        <BotonPrincipal
          titulo="Continuar"
          alPresionar={handleContinuar}
          estilo={styles.button}
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
