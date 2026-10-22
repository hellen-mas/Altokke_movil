import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
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
  const { colores } = useAltokkeTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionado }}
      accessibilityLabel={`${titulo}: ${subtitulo}`}
      accessibilityHint="Toca para seleccionar este tipo de cuenta"
      style={({ pressed }) => [
        estilos.tarjeta,
        {
          backgroundColor: seleccionado
            ? colores.exitoFondo
            : colores.superficie,
          borderColor: seleccionado ? colores.exitoTexto : colores.linea,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[estilos.iconoBox, { backgroundColor: colores.campo }]}>
        <Ionicons
          name={nombreIcono}
          size={28}
          color={seleccionado ? colores.exitoTexto : colores.secundario}
        />
      </View>

      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: colores.texto }]}>{titulo}</Text>
        <Text style={[estilos.subtitulo, { color: colores.secundario }]}>
          {subtitulo}
        </Text>
      </View>

      <Ionicons
        name={seleccionado ? "checkmark-circle" : "ellipse-outline"}
        size={23}
        color={seleccionado ? colores.exitoTexto : colores.secundario}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 104,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  iconoBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  textos: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  titulo: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontWeight: "500",
  },
});

export default TarjetaRol;
