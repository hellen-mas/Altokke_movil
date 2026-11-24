import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export function AvisoLegalTerminos() {
  const { colores } = useAltokkeTheme();

  const urlTerminos =
    process.env.EXPO_PUBLIC_TERMS_URL || "https://altokke.pe/terminos";
  const urlPrivacidad =
    process.env.EXPO_PUBLIC_PRIVACY_URL || "https://altokke.pe/privacidad";

  const abrirEnlace = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn("No se pudo abrir enlace legal:", err);
    });
  };

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.textoLegal, { color: colores.secundario }]}>
        Al continuar, aceptas nuestros{" "}
        <Text
          style={[styles.enlaceLegal, { color: colores.exitoTexto }]}
          onPress={() => abrirEnlace(urlTerminos)}
          accessibilityRole="link"
        >
          Términos de servicio
        </Text>{" "}
        y{" "}
        <Text
          style={[styles.enlaceLegal, { color: colores.exitoTexto }]}
          onPress={() => abrirEnlace(urlPrivacidad)}
          accessibilityRole="link"
        >
          Política de privacidad
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingHorizontal: 8,
    marginTop: 4,
  },
  textoLegal: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  enlaceLegal: {
    fontWeight: "600",
  },
});

export default AvisoLegalTerminos;
