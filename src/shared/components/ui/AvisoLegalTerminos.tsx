import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export function AvisoLegalTerminos() {
  const { colores } = useAltokkeTheme();

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.textoLegal, { color: colores.secundario }]}>
        Al continuar, aceptas nuestros{" "}
        <Text style={[styles.enlaceLegal, { color: colores.exitoTexto }]}>
          Términos de servicio
        </Text>{" "}
        y{" "}
        <Text style={[styles.enlaceLegal, { color: colores.exitoTexto }]}>
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
