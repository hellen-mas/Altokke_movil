import { paletaColores } from "@/paletaColores";
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
  variante="oscuro",
}: TarjetaOpcionProps) {
  const esClaro = variante === "claro";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        esClaro && styles.cardClaro,
        activa && styles.cardActiva,
        activa && esClaro && styles.cardActivaClara,
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
        esClaro && styles.iconContainerClaro,
        ]}
      >
        <Ionicons
          name={icono}
          size={22}
          color={
            esClaro 
              ? paletaColores.primaryHover 
              : paletaColores.primary
            }
        />
      </View>

      <View style={styles.textos}>
        <Text
          style={[
            styles.titulo,
            esClaro && styles.tituloClaro,
          ]}
        >
          {titulo}
        </Text>

        <Text
          style={[
            styles.descripcion,
            esClaro && styles.descripcionClara,
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
            ? paletaColores.primary
            : esClaro 
              ? paletaColores.textoSecundarioClaro
              : paletaColores.textoSecundario
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
    borderColor: paletaColores.borde,
    borderRadius: 14,
    backgroundColor: paletaColores.surface,
    gap: 12,
  },
  cardClaro: {
    backgroundColor: paletaColores.superficieClara,
    borderColor: paletaColores.bordeClaro,
  },
  cardActiva: {
    borderColor: paletaColores.primary,
  },
  cardActivaClara: {
    borderColor: "#B4DCC6",
    backgroundColor: "#F5FBF7",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: paletaColores.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerClaro: {
    backgroundColor: "#EAF5EF",
  },
  textos: {
    flex: 1,
    gap: 3,
  },
  titulo: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.texto,
  },
  tituloClaro: {
    color: paletaColores.textoClaro,
  },
  descripcion: {
    fontSize: 12,
    lineHeight: 17,
    color: paletaColores.textoSecundario,
  },
  descripcionClara: {
    color: paletaColores.textoSecundarioClaro,
  },
  presionada: {
    opacity: 0.75,
  },
});
