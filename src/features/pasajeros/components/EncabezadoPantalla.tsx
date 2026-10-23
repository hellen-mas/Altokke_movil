import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  titulo: string;
}

export function EncabezadoPantalla({ titulo }: Props) {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useAltokkeTheme();

  const volver = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/mapa");
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

      <Pressable
        onPress={volver}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.botonVolver}
        accessibilityRole="button"
        accessibilityLabel="Volver atrás"
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={colores.texto}
        />
      </Pressable>

      <Text style={[styles.titulo, { color: colores.texto }]}>{titulo}</Text>

      {/* Espacio vacío equilibrado para que el título quede centrado */}
      <View style={styles.espaciador} />
    </View>
  );
}

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
