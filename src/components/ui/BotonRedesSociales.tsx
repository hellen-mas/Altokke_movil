import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

interface PropsBotonRedesSociales {
  disabled?: boolean;
  titulo: string;
  nombreIcono: keyof typeof Ionicons.glyphMap;
  colorIcono: string;
  onPress?: () => void;
}

export function BotonRedesSociales({ titulo, nombreIcono, colorIcono, onPress, disabled=false, }: PropsBotonRedesSociales) {
  const { colores } = useAltokkeTheme();

  return (
    <Pressable 
      style={({ pressed }) => [
        estilos.boton,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.linea,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]} 
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={nombreIcono} size={22} color={colorIcono} />
      <Text 
        style={[
          estilos.texto,
          { color: colores.texto },
        ]}
      >{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: "100%",
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 30,
  },
  texto: {
    fontSize: 15,
    fontWeight: "600",
  },
});
