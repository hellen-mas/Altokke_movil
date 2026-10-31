
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  titulo: string;
  subtitulo?: string;
  mostrarRegreso?: boolean;
  alRegresar?: () => void;
  children?: ReactNode;
}

export function CabeceraFlujoViaje({
  titulo,
  subtitulo,
  mostrarRegreso = true,
  alRegresar,
  children,
}: Props) {
  const { colores } = useAltokkeTheme();
  const insets = useSafeAreaInsets();

  const regresar = () => {
    if (alRegresar) {
      alRegresar();
      return;
    }

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
          paddingTop: insets.top + 8,
          backgroundColor: colores.fondo,
        },
      ]}
    >
      <View style={styles.fila}>
        {mostrarRegreso && (
          <Pressable
            onPress={regresar}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={8}
            style={({ pressed }) => [
              styles.botonRegresar,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
              pressed && { opacity: 0.65 },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colores.texto}
            />
          </Pressable>
        )}

        <View style={styles.textos}>
          <Text
            style={[styles.titulo, { color: colores.texto }]}
            numberOfLines={2}
          >
            {titulo}
          </Text>

          {subtitulo && (
            <Text
              style={[
                styles.subtitulo,
                { color: colores.secundario },
              ]}
              numberOfLines={2}
            >
              {subtitulo}
            </Text>
          )}
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 46,
  },

  botonRegresar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  textos: {
    flex: 1,
    gap: 3,
  },

  titulo: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  subtitulo: {
    fontSize: 12,
    lineHeight: 17,
  },
});
