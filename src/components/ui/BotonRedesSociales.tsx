import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

interface Props {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress?: () => void;
}

export function BotonRedesSociales({ title, iconName, iconColor, onPress }: Props) {
  return (
    <Pressable style={styles.socialButton} onPress={onPress}>
      <Ionicons name={iconName} size={20} color={iconColor} />
      <Text style={styles.socialButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  socialButton: {
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
  socialButtonText: {
    color: paletaColores.texto,
    fontSize: 13,
    fontWeight: "500",
  },
});
