import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

interface Props {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({ title, onPress, style }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && { backgroundColor: paletaColores.botonPresionado },
      ]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
      <Ionicons name="arrow-forward" size={26} color="black" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.boton,
    borderRadius: 17,
    marginTop: 3,
    gap: 35,
  },
  text: { fontSize: 19, lineHeight: 24, fontWeight: "700", color: "#000000" },
});
