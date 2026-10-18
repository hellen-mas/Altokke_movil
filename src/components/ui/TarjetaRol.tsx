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
          size={26}
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
            size={26}
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
    minHeight: 96,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 16,
  },
  tarjetaPresionada: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  tarjetaSeleccionada: {
    borderWidth: 2,
    borderColor: paletaColores.boton,
    backgroundColor: paletaColores.superficieElevada,
  },
  tarjetaNoSeleccionada: {
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    backgroundColor: paletaColores.tarjeta,
  },
  contenedorIcono: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  contenedorIconoSeleccionado: {
    backgroundColor: "rgba(36, 166, 101, 0.16)",
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
    color: paletaColores.texto,
  },
  tituloNoSeleccionado: {
    color: paletaColores.texto,
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 24, // Permite leer con comodidad cada descripción
    letterSpacing: -0.1,
  },
  subtituloSeleccionado: {
    color: paletaColores.textoSecundario,
  },
  subtituloNoSeleccionado: {
    color: paletaColores.textoSecundario,
  },
  contenedorCheck: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInactivo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: paletaColores.bordeFuerte,
  },
});


