import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

interface PropsBotonRedesSociales {
  disabled?: boolean;
  titulo: string;
  nombreIcono: keyof typeof Ionicons.glyphMap;
  colorIcono: string;
  onPress?: () => void;
}

export function BotonRedesSociales({ titulo, nombreIcono, colorIcono, onPress, disabled }: PropsBotonRedesSociales) {
  return (
    <Pressable 
      style={({ pressed }) => [
        estilos.botonRedSocial,
        pressed && estilos.botonPresionado
      ]} 
      disabled={disabled}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <Ionicons name={nombreIcono} size={20} color={colorIcono} />
      <Text style={estilos.textoBotonRedSocial}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botonRedSocial: {
    width: "100%",
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    borderRadius: 30,
    backgroundColor: paletaColores.input,
  },
  botonPresionado: {
    opacity: 0.7,
    backgroundColor: paletaColores.tarjeta,
  },
  textoBotonRedSocial: {
    color: paletaColores.texto,
    fontSize: 15,
    fontWeight: "600",
  },
});
