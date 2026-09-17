import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { paletaColores } from "../../paletaColores";

interface CustomInputProps {
  placeholder: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export default function CustomInput({
  placeholder,
  iconName,
  isPassword,
}: CustomInputProps) {
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <Ionicons
        name={iconName}
        size={21}
        color={paletaColores.textoSecundario}
      />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={paletaColores.textoSecundario}
        secureTextEntry={isPassword && !visible}
      />

      {isPassword ? (
        <Pressable
          onPress={() => {
            setVisible((visible) => !visible);
          }}
          style={styles.botonOjo}
        >
          <Ionicons
            name={visible ? "eye-outline" : "eye-off-outline"}
            size={21}
            color={paletaColores.textoSecundario}
          />
        </Pressable>
      ) : null}
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

  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: paletaColores.texto,
  },

  botonOjo: {
    padding: 4,
  },
});
