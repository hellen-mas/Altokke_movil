import { paletaColores } from "@/paletaColores";
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
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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
          size={22}
          color={seleccionado ? paletaColores.boton : paletaColores.textoSecundario}
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
            size={24}
            color={paletaColores.boton}
          />
        ) : (
          <View style={estilos.radioInactivo} />
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 90,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  tarjetaPresionada: {
    opacity: 0.85,
  },
  tarjetaSeleccionada: {
    borderWidth: 2,
    borderColor: paletaColores.boton,
    backgroundColor: paletaColores.superficieElevada,
  },
  tarjetaNoSeleccionada: {
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    backgroundColor: paletaColores.superficie,
  },
  contenedorIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  contenedorIconoSeleccionado: {
    backgroundColor: "rgba(36, 166, 101, 0.15)",
  },
  contenedorIconoNoSeleccionado: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  contenedorTexto: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  tituloSeleccionado: {
    color: "#FFFFFF",
  },
  tituloNoSeleccionado: {
    color: "#FFFFFF",
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  subtituloSeleccionado: {
    color: "#D0DFD6",
  },
  subtituloNoSeleccionado: {
    color: "#9BB0A5",
  },
  contenedorCheck: {
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInactivo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeFuerte,
  },
});


