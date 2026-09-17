import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { paletaColores } from "../../paletaColores";

interface CustomInputProps extends TextInputProps {
  placeholder: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  variant?: "dark" | "light";
}

export default function CustomInput({
  placeholder,
  iconName,
  isPassword = false,
  variant = "dark",
  ...inputProps // value, onChangeText, keyboardType, maxLenght
}: CustomInputProps) {
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
        {...inputProps}
        style={[
          styles.input, 
          isLight && styles.inputLight,
          inputProps.style,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colorSecundario}
        secureTextEntry={
          isPassword ? !visible : inputProps.secureTextEntry
        }
      />

      {isPassword && (
        <Pressable
          onPress={() => {
            setVisible((visible) => !visible);
          }}
          style={styles.botonOjo}
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
}

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
