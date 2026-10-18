import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface TarjetaOpcionProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  activa: boolean;
  alCambiar: (activa: boolean) => void;
  estilo?: StyleProp<ViewStyle>;
}

export function TarjetaOpcion({
  icono,
  titulo,
  descripcion,
  activa,
  alCambiar,
  estilo,
}: TarjetaOpcionProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.opcionCard,
        activa && styles.opcionCardActiva,
        pressed && { opacity: 0.8 },
        estilo,
      ]}
      onPress={() => alCambiar(!activa)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View style={[styles.iconContainer, activa && styles.iconContainerActivo]}>
        <Ionicons
          name={icono}
          size={22}
          color={activa ? paletaColores.textoOscuro : paletaColores.textoSecundario}
        />
      </View>
      <View style={styles.opcionTextos}>
        <Text style={styles.opcionTitulo}>{titulo}</Text>
        <Text style={styles.opcionDescripcion}>{descripcion}</Text>
      </View>
      <Ionicons
        name={activa ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={activa ? paletaColores.boton : paletaColores.borde}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opcionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    borderRadius: 16,
    backgroundColor: paletaColores.input,
  },
  opcionCardActiva: {
    borderColor: paletaColores.boton,
    backgroundColor: "rgba(46, 206, 121, 0.08)",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconContainerActivo: {
    backgroundColor: paletaColores.boton,
  },
  opcionTextos: {
    flex: 1,
    paddingRight: 8,
  },
  opcionTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  opcionDescripcion: {
    fontSize: 14,
    color: "#C2D4CB",
    lineHeight: 20,
  },
});
