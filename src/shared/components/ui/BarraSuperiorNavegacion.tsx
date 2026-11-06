import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface PropsBarraSuperiorNavegacion {
  titulo: string;
  onVolver?: () => void;
  rutaRespaldo?: Href;
  mostrarVolver?: boolean;
}

export function BarraSuperiorNavegacion({
  titulo,
  onVolver,
  rutaRespaldo = "/mapa" as Href,
  mostrarVolver = true,
}: PropsBarraSuperiorNavegacion) {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useAltokkeTheme();

  const volver = () => {
    if (onVolver) {
      onVolver();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(rutaRespaldo);
    }
  };

  return (
    <View
      style={[
        styles.contenedor,
        {
          paddingTop: insets.top + 10,
          backgroundColor: colores.fondo,
          borderBottomColor: colores.linea,
        },
      ]}
    >
      <StatusBar style={esOscuro ? "light" : "dark"} />

      {mostrarVolver ? (
        <Pressable
          onPress={volver}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.botonVolver}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <Ionicons name="chevron-back" size={24} color={colores.texto} />
        </Pressable>
      ) : (
        <View style={styles.espaciador} />
      )}

      <Text style={[styles.titulo, { color: colores.texto }]}>{titulo}</Text>

      <View style={styles.espaciador} />
    </View>
  );
}

export default BarraSuperiorNavegacion;

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  botonVolver: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  espaciador: {
    width: 44,
  },
  titulo: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
});
