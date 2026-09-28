import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

export interface CustomInputProps extends TextInputProps {
  iconName: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  variant?: "dark" | "light";
  error?: boolean;
  errorText?: string;
}

export const CampoTexto = ({
  iconName,
  isPassword,
  variant = "dark",
  error,
  errorText,
  style,
  ...rest
}: CustomInputProps) => {
  const [visible, setVisible] = useState(false);
    
    const isLight = variant === "light";
    const colorSecundario = isLight
      ? paletaColores.textoSecundarioClaro
      : paletaColores.textoSecundario;

    return (
      <View style={styles.wrapper}>
        <View 
          style={[
            styles.container,
            isLight && styles.containerLight,
            error && styles.containerError,
          ]}
        >
          <Ionicons
            name={iconName}
            size={21}
            color={error ? "red" : colorSecundario}
          />

          <TextInput
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
        {error && errorText ? (
          <Text style={styles.errorText}>{errorText}</Text>
        ) : null}
      </View>
    );
};

export default CampoTexto;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
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
  containerError: {
    borderColor: "red",
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
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
});
