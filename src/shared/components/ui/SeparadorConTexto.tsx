import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export interface PropsSeparadorConTexto {
  texto?: string;
}

export function SeparadorConTexto({
  texto = "o ingresa con",
}: PropsSeparadorConTexto) {
  const { colores } = useAltokkeTheme();

  return (
    <View style={styles.contenedor}>
      <View style={[styles.linea, { backgroundColor: colores.linea }]} />
      <Text
        style={[
          styles.texto,
          { color: colores.secundario, backgroundColor: colores.fondo },
        ]}
      >
        {texto}
      </Text>
      <View style={[styles.linea, { backgroundColor: colores.linea }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  linea: {
    flex: 1,
    height: 1,
  },
  texto: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "500",
  },
});

export default SeparadorConTexto;
