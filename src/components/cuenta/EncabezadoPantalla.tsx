import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { paletaColores } from "@/paletaColores";

interface Props {
  titulo: string;
}

export function EncabezadoPantalla({ titulo }: Props) {
  const insets = useSafeAreaInsets();

  const volver = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/mapa");
    }
  };

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      {/* Iconos oscuros porque el fondo de estas pantallas es claro */}
      <StatusBar style="dark" />

      <Pressable onPress={volver} hitSlop={12} style={styles.lado}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={paletaColores.textoClaro}
        />
      </Pressable>

      <Text style={styles.titulo}>{titulo}</Text>

      {/* Espacio vacío para que el título quede centrado */}
      <View style={styles.lado} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: paletaColores.fondoClaro,
  },

  lado: {
    width: 32,
  },

  titulo: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },
});
