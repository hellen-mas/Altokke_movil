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
      hitSlop={8}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionado }}
      accessibilityLabel={`${titulo}: ${subtitulo}`}
      accessibilityHint="Toca para seleccionar este tipo de cuenta"
      style={({ pressed }) => [
        estilos.tarjeta,
        {
          borderColor: seleccionado ? paletaColores.primary : paletaColores.surfaceBorder,
          backgroundColor: seleccionado ? paletaColores.surfaceElevated : paletaColores.surface,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View
        style={[
          estilos.iconoBox,
          { backgroundColor: seleccionado ? paletaColores.primaryMuted : "rgba(255, 255, 255, 0.04)" },
        ]}
      >
        <Ionicons
          name={nombreIcono}
          size={28}
          color={seleccionado ? paletaColores.primary : paletaColores.textSecondary}
        />
      </View>

      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.subtitulo}>{subtitulo}</Text>
      </View>

      <View style={estilos.checkWrap}>
        {seleccionado ? (
          <Ionicons name="checkmark-circle" size={26} color={paletaColores.primary} />
        ) : (
          <View style={estilos.radioVacio} />
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
    color: paletaColores.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontWeight: "500",
    color: paletaColores.textSecondary,
  },
  checkWrap: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  radioVacio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: paletaColores.surfaceBorder,
  },
});

export default TarjetaRol;
