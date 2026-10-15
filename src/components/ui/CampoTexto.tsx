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

export interface PropsCampoTexto extends TextInputProps {
  nombreIcono: keyof typeof Ionicons.glyphMap;
  esPassword?: boolean;
  variante?: "oscuro" | "claro";
  error?: boolean;
  textoError?: string;
}

export const CampoTexto = ({
  nombreIcono,
  esPassword,
  variante = "oscuro",
  error,
  textoError,
  style,
  ...rest
}: PropsCampoTexto) => {
  const [visible, setVisible] = useState(false);
    
    const esClaro = variante === "claro";
    const colorSecundario = esClaro
      ? paletaColores.textoSecundarioClaro
      : "#8FA198";

    return (
      <View style={estilos.envoltorio}>
        <View 
          style={[
            estilos.contenedor,
            esClaro && estilos.contenedorClaro,
            error && estilos.contenedorError,
          ]}
        >
          <Ionicons
            name={nombreIcono}
            size={24}
            color={error ? "#FF5E5E" : colorSecundario}
          />

          <TextInput
            style={[
              estilos.entrada, 
              esClaro && estilos.entradaClara,
              style,
            ]}
            placeholderTextColor={colorSecundario}
            secureTextEntry={esPassword ? !visible : rest.secureTextEntry}
            accessibilityLabel={rest.placeholder || "Campo de texto"}
            {...rest}
          />
          {esPassword && (
            <Pressable
              onPress={() => setVisible((prev) => !prev)}
              style={estilos.botonOjo}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={
                visible ? "Ocultar contraseña" : "Ver contraseña"
              }
              accessibilityHint="Muestra u oculta los caracteres de la contraseña"
            >
              <Ionicons
                name={visible ? "eye-outline" : "eye-off-outline"}
                size={24}
                color={colorSecundario}
              />
            </Pressable>
          )}
        </View>
        {error && textoError ? (
          <Text style={estilos.textoError}>{textoError}</Text>
        ) : null}
      </View>
    );
};

const estilos = StyleSheet.create({
  envoltorio: {
    width: "100%",
  },
  contenedor: {
    width: "100%",
    minHeight: 60,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 16,
    backgroundColor: paletaColores.input,
  },
  contenedorClaro: {
    backgroundColor: paletaColores.inputClaro,
    borderColor: paletaColores.bordeClaro,
  },
  contenedorError: {
    borderColor: "#FF5E5E",
  },
  entrada: {
    flex: 1,
    fontSize: 18,
    color: paletaColores.texto,
  },
  entradaClara: {
    color: paletaColores.textoClaro,
  },
  botonOjo: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  textoError: {
    color: "#FF5E5E",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
    marginLeft: 8,
  },
});
