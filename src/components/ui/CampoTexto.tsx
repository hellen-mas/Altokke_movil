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
  nombreIcono?: keyof typeof Ionicons.glyphMap;
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
  onFocus,
  onBlur,
  ...rest
}: PropsCampoTexto) => {
  const [visible, setVisible] = useState(false);
  const [enFoco, setEnFoco] = useState(false);

  const esClaro = variante === "claro";
  const colorSecundario = esClaro
    ? paletaColores.textoSecundarioClaro
    : paletaColores.textoSecundario;

  const colorIcono = error
    ? paletaColores.error
    : enFoco
    ? paletaColores.boton
    : colorSecundario;

  const manejarFocus: TextInputProps["onFocus"] = (e) => {
    setEnFoco(true);
    if (onFocus) onFocus(e);
  };

  const manejarBlur: TextInputProps["onBlur"] = (e) => {
    setEnFoco(false);
    if (onBlur) onBlur(e);
  };


  return (
    <View style={estilos.envoltorio}>
      <View
        style={[
          estilos.contenedor,
          esClaro && estilos.contenedorClaro,
          enFoco && estilos.contenedorFoco,
          error && estilos.contenedorError,
        ]}
      >
        {nombreIcono && (
          <Ionicons
            name={nombreIcono}
            size={20}
            color={colorIcono}
            style={estilos.iconoIzquierdo}
          />
        )}

        <TextInput
          style={[
            estilos.entrada,
            esClaro && estilos.entradaClara,
            style,
          ]}
          placeholderTextColor={colorSecundario}
          secureTextEntry={esPassword ? !visible : rest.secureTextEntry}
          accessibilityLabel={rest.placeholder || "Campo de texto"}
          onFocus={manejarFocus}
          onBlur={manejarBlur}
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
              size={20}
              color={colorSecundario}
            />
          </Pressable>
        )}
      </View>

      {error && textoError ? (
        <View style={estilos.filaError}>
          <Ionicons
            name="alert-circle-outline"
            size={14}
            color={paletaColores.error}
          />
          <Text style={estilos.textoError}>{textoError}</Text>
        </View>
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
    minHeight: 58,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
    borderRadius: 16,
    backgroundColor: paletaColores.input,
  },
  contenedorClaro: {
    backgroundColor: paletaColores.inputClaro,
    borderColor: paletaColores.bordeClaro,
  },
  contenedorFoco: {
    borderColor: paletaColores.boton,
    backgroundColor: paletaColores.superficieElevada,
  },
  contenedorError: {
    borderColor: paletaColores.error,
    backgroundColor: paletaColores.errorFondo,
  },
  iconoIzquierdo: {
    marginRight: 4,
  },
  entrada: {
    flex: 1,
    fontSize: 17,
    color: paletaColores.texto,
    paddingVertical: 0,
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
  filaError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    marginLeft: 6,
  },
  textoError: {
    color: paletaColores.error,
    fontSize: 14,
    fontWeight: "500",
  },
});


