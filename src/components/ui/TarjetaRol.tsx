import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface PropsTarjetaRol {
  titulo: string;
  subtitulo: string;
  nombreIcono: keyof typeof Ionicons.glyphMap;
  seleccionado: boolean;
  onPress: () => void;
}

export function TarjetaRol({
  titulo,
  subtitulo,
  nombreIcono,
  seleccionado,
  onPress,
}: PropsTarjetaRol) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionado }}
      accessibilityLabel={`${titulo}: ${subtitulo}`}
      accessibilityHint="Toca para seleccionar este tipo de cuenta"
      style={({ pressed }) => [
        estilos.tarjeta,
        seleccionado ? estilos.tarjetaSeleccionada : estilos.tarjetaNoSeleccionada,
        pressed && estilos.tarjetaPresionada,
      ]}
    >
      <View
        style={[
          estilos.contenedorIcono,
          seleccionado
            ? estilos.contenedorIconoSeleccionado
            : estilos.contenedorIconoNoSeleccionado,
        ]}
      >
        <Ionicons
          name={nombreIcono}
          size={30}
          color={seleccionado ? "#051A10" : "#8A9C92"}
        />
      </View>
      <View style={estilos.contenedorTexto}>
        <Text
          style={[
            estilos.titulo,
            seleccionado ? estilos.tituloSeleccionado : estilos.tituloNoSeleccionado,
          ]}
        >
          {titulo}
        </Text>
        <Text
          style={[
            estilos.subtitulo,
            seleccionado
              ? estilos.subtituloSeleccionado
              : estilos.subtituloNoSeleccionado,
          ]}
        >
          {subtitulo}
        </Text>
      </View>
      <View style={estilos.contenedorCheck}>
        {seleccionado ? (
          <Ionicons
            name="checkmark-circle"
            size={32}
            color="#2ECE79"
          />
        ) : (
          <Ionicons
            name="ellipse-outline"
            size={32}
            color="rgba(255, 255, 255, 0.22)"
          />
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 104,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 18,
  },
  tarjetaPresionada: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  tarjetaSeleccionada: {
    borderWidth: 2,
    borderColor: "#2ECE79",
    backgroundColor: "rgba(46, 206, 121, 0.13)",
  },
  tarjetaNoSeleccionada: {
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.09)",
    backgroundColor: "rgba(255, 255, 255, 0.035)",
  },
  contenedorIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  contenedorIconoSeleccionado: {
    backgroundColor: "#2ECE79",
  },
  contenedorIconoNoSeleccionado: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  contenedorTexto: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  titulo: {
    fontSize: 21,
    marginBottom: 6,
  },
  tituloSeleccionado: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  tituloNoSeleccionado: {
    color: "#E2ECE6",
    fontWeight: "700",
  },
  subtitulo: {
    fontSize: 17,
    lineHeight: 24,
  },
  subtituloSeleccionado: {
    color: "#EDF7F2",
    fontWeight: "500",
  },
  subtituloNoSeleccionado: {
    color: "#C2D4CB",
    fontWeight: "400",
  },
  contenedorCheck: {
    justifyContent: "center",
    alignItems: "center",
  },
});
