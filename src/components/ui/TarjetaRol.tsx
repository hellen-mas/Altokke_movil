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
            size={22}
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
    minHeight: 76,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  tarjetaPresionada: {
    opacity: 0.85,
  },
  tarjetaSeleccionada: {
    borderWidth: 1.5,
    borderColor: paletaColores.boton,
    backgroundColor: paletaColores.superficieElevada,
  },
  tarjetaNoSeleccionada: {
    borderWidth: 1,
    borderColor: paletaColores.borde,
    backgroundColor: paletaColores.superficie,
  },
  contenedorIcono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  contenedorIconoSeleccionado: {
    backgroundColor: "rgba(36, 166, 101, 0.12)",
  },
  contenedorIconoNoSeleccionado: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  contenedorTexto: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  tituloSeleccionado: {
    color: paletaColores.texto,
  },
  tituloNoSeleccionado: {
    color: paletaColores.texto,
  },
  subtitulo: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  subtituloSeleccionado: {
    color: paletaColores.textoSecundario,
  },
  subtituloNoSeleccionado: {
    color: paletaColores.textoTerciario,
  },
  contenedorCheck: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInactivo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeFuerte,
  },
});

