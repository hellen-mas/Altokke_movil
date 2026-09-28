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

export interface PropsCampoTexto extends Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> {
  nombreIcono: keyof typeof Ionicons.glyphMap;
  esPassword?: boolean;
  variante?: "oscuro" | "claro";
  error?: boolean;
  textoError?: string;
  valor?: string;
  alCambiarTexto?: (text: string) => void;
  textoReferencia?: string;
}

export const CampoTexto = ({
  nombreIcono,
  esPassword,
  variante = "oscuro",
  error,
  textoError,
  valor,
  alCambiarTexto,
  textoReferencia,
  style,
  ...rest
}: PropsCampoTexto) => {
  const [visible, setVisible] = useState(false);
    
    const esClaro = variante === "claro";
    const colorSecundario = esClaro
      ? paletaColores.textoSecundarioClaro
      : paletaColores.textoSecundario;

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
            size={21}
            color={error ? "red" : colorSecundario}
          />

          <TextInput
            style={[
              estilos.entrada, 
              esClaro && estilos.entradaClara,
              style,
            ]}
            placeholderTextColor={colorSecundario}
            secureTextEntry={esPassword ? !visible : rest.secureTextEntry}
            value={valor}
            onChangeText={alCambiarTexto}
            placeholder={textoReferencia}
            {...rest}
          />
          {esPassword && (
            <Pressable
              onPress={() => setVisible((prev) => !prev)}
              style={estilos.botonOjo}
              accessibilityRole="button"
              accessibilityLabel={
                visible ? "Ocultar password" : "Mostrar password"
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
        {error && textoError ? (
          <Text style={estilos.textoError}>{textoError}</Text>
        ) : null}
      </View>
    );
};

export default CampoTexto;

const estilos = StyleSheet.create({
  envoltorio: {
    width: "100%",
  },
  contenedor: {
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
  contenedorClaro: {
    backgroundColor: paletaColores.inputClaro,
    borderColor: paletaColores.bordeClaro,
  },
  contenedorError: {
    borderColor: "red",
  },
  entrada: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: paletaColores.texto,
  },
  entradaClara: {
    color: paletaColores.textoClaro,
  },
  botonOjo: {
    padding: 4,
  },
  textoError: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
});
