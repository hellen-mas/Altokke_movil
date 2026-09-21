import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

export interface CustomInputProps extends TextInputProps {
  iconName: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  variant?: "dark" | "light";
}

export const CustomInput = forwardRef<TextInput, CustomInputProps>(
  ({ iconName, isPassword, variant = "dark", style, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    
    const isLight = variant === "light";
    const colorSecundario = isLight
      ? paletaColores.textoSecundarioClaro
      : paletaColores.textoSecundario;

    return (
      <View 
        style={[
          styles.container,
          isLight && styles.containerLight,
        ]}
      >
        <Ionicons
          name={iconName}
          size={21}
          color={colorSecundario}
        />

        <TextInput
          ref={ref}
          style={[
            styles.input, 
            isLight && styles.inputLight,
            style,
          ]}
          placeholderTextColor={colorSecundario}
          secureTextEntry={isPassword ? !visible : rest.secureTextEntry}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setVisible((prev) => !prev)}
            style={styles.botonOjo}
            accessibilityRole="button"
            accessibilityLabel={
              visible ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            <Ionicons
              name={visible ? "eye-outline" : "eye-off-outline"}
              size={21}
              color={colorSecundario}
            />
          </Pressable>
        )}
      </View>
    );
  },
);

CustomInput.displayName = "CustomInput";
export default CustomInput;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 14,
    backgroundColor: paletaColores.input,
  },
  containerLight: {
    backgroundColor: paletaColores.inputClaro,
    borderColor: paletaColores.bordeClaro,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: paletaColores.texto,
  },
  inputLight: {
    color: paletaColores.textoClaro,
  },
  botonOjo: {
    padding: 4,
  },
});
