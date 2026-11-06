import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

interface PropsBotonRedesSociales {
  titulo: string;
  nombreIcono: keyof typeof Ionicons.glyphMap;
  colorIcono: string;
  alPresionar?: () => void;
}

export function BotonRedesSociales({ titulo, nombreIcono, colorIcono, alPresionar }: PropsBotonRedesSociales) {
  return (
    <Pressable style={estilos.botonRedSocial} onPress={alPresionar}>
      <Ionicons name={nombreIcono} size={20} color={colorIcono} />
      <Text style={estilos.textoBotonRedSocial}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botonRedSocial: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  textoBotonRedSocial: {
    color: paletaColores.texto,
    fontSize: 13,
    fontWeight: "500",
  },
});
