import { paletaColores } from "@/shared/theme/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export interface PropsBotonVolverPaso {
  texto?: string;
  alPresionar?: () => void;
}

export function BotonVolverPaso({
  texto = "Volver al paso anterior",
  alPresionar,
}: PropsBotonVolverPaso) {
  const manejarPresionar = alPresionar || (() => router.back());

  return (
    <Pressable
      style={styles.botonVolver}
      onPress={manejarPresionar}
      accessibilityRole="button"
      accessibilityLabel={texto}
    >
      <Ionicons
        name="arrow-back-outline"
        size={18}
        color={paletaColores.textoSecundarioClaro}
      />
      <Text style={styles.textoBotonVolver}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botonVolver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  textoBotonVolver: {
    fontSize: 14,
    fontWeight: "500",
    color: paletaColores.textoSecundarioClaro,
  },
});

export default BotonVolverPaso;
