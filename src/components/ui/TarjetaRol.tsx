import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface PropsTarjetaRol {
  titulo: string;
  subtitulo: string;
  nombreIcono: keyof typeof Ionicons.glyphMap;
  seleccionado: boolean;
  alPresionar: () => void;
}

export function TarjetaRol({
  titulo,
  subtitulo,
  nombreIcono,
  seleccionado,
  alPresionar,
}: PropsTarjetaRol) {
  return (
    <Pressable
      onPress={alPresionar}
      style={[
        estilos.tarjeta,
        seleccionado ? estilos.tarjetaSeleccionada : estilos.tarjetaNoSeleccionada,
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
          size={24}
          color={seleccionado ? paletaColores.boton : paletaColores.textoSecundario}
        />
      </View>
      <View style={estilos.contenedorTexto}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.subtitulo}>{subtitulo}</Text>
      </View>
      <View style={estilos.contenedorCheck}>
        {seleccionado ? (
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={paletaColores.boton}
          />
        ) : (
          <Ionicons
            name="ellipse-outline"
            size={28}
            color={paletaColores.textoSecundario}
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  tarjetaSeleccionada: {
    borderColor: paletaColores.boton,
    backgroundColor: "rgba(53, 233, 130, 0.05)",
  },
  tarjetaNoSeleccionada: {
    borderColor: paletaColores.borde,
    backgroundColor: "transparent",
  },
  contenedorIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  contenedorIconoSeleccionado: {
    backgroundColor: "rgba(53, 233, 130, 0.15)",
  },
  contenedorIconoNoSeleccionado: {
    backgroundColor: "rgba(70, 97, 87, 0.2)",
  },
  contenedorTexto: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  titulo: {
    color: paletaColores.texto,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitulo: {
    color: paletaColores.textoSecundario,
    fontSize: 14,
  },
  contenedorCheck: {
    justifyContent: "center",
    alignItems: "center",
  },
});
