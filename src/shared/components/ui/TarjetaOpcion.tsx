import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { 
  Pressable, 
  StyleProp, 
  StyleSheet, 
  Text, 
  View, 
  ViewStyle 
} from "react-native";

export interface TarjetaOpcionProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  activa: boolean;
  alCambiar: (activa: boolean) => void;
  estilo?: StyleProp<ViewStyle>;
  variante?: "oscuro" | "claro";
}

export function TarjetaOpcion({
  icono,
  titulo,
  descripcion,
  activa,
  alCambiar,
  estilo,
}: TarjetaOpcionProps) {
  const { colores } = useAltokkeTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: activa
            ? colores.exitoFondo
            : colores.superficie,

          borderColor: activa
            ? colores.exitoTexto
            : colores.linea,
        },
        pressed && styles.presionada,
        estilo,
      ]}
      onPress={() => alCambiar(!activa)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: activa }}
      accessibilityLabel={titulo}
      hitSlop={4}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: colores.campo },
        ]}
      >
        <Ionicons
          name={icono}
          size={22}
          color={colores.exitoTexto}
        />
      </View>

      <View style={styles.textos}>
        <Text
          style={[
            styles.titulo,
            { color: colores.texto }
          ]}
        >
          {titulo}
        </Text>

        <Text
          style={[
            styles.descripcion,
            { color: colores.secundario }
          ]}
        >
          {descripcion}
        </Text>
      </View>

      <Ionicons
        name={
          activa 
            ? "checkmark-circle" 
            : "ellipse-outline"
          }
        size={24}
        color={
          activa 
            ? colores.exitoTexto
            : colores.secundario
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 14,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 3,
  },
  titulo: {
    fontSize: 14,
    fontWeight: "700",
  },
  descripcion: {
    fontSize: 12,
    lineHeight: 17,
  },
  presionada: {
    opacity: 0.75,
  },
});
