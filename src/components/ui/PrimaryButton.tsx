import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

export interface Props {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ 
  title, 
  onPress, 
  style,
  isLoading,
  disabled
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        (disabled || isLoading) && styles.disabled,
        pressed && !disabled && !isLoading && { backgroundColor: paletaColores.botonPresionado },
        pressed && styles.pressed,
      ]}
      disabled={disabled || isLoading}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color={paletaColores.textoOscuro} />
      ) : (
        <View style={styles.contenido}>
          <Text style={styles.text}>{title}</Text>
          <Ionicons 
            name="arrow-forward" 
            size={26} 
            color={paletaColores.textoOscuro} 
          />
        </View>
      )}
    </Pressable>
  );
}

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.boton,
    borderRadius: 16,
    marginTop: 3,
  },
  text: { 
    fontSize: 19, 
    lineHeight: 24, 
    fontWeight: "700", 
    color: paletaColores.textoOscuro, 
  },
  disabled: {
    backgroundColor: "#A0A0A0",
  },
  pressed: { 
    transform: [{ scale: 0.98 }] 
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
});
