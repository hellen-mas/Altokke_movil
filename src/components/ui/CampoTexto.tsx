import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
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
  variante?: "oscuro" | "claro" | "automatico" | string;
  error?: boolean;
  textoError?: string;
  etiqueta?: string;
}

export const CampoTexto = ({
  nombreIcono,
  esPassword = false,
  variante = "automático",
  error = false,
  textoError,
  etiqueta,
  placeholder,
  style,
  onFocus,
  onBlur,
  ...rest
}: PropsCampoTexto) => {
  const [visible, setVisible] = useState(false);
  const [enFoco, setEnFoco] = useState(false);

  const { esOscuro, colores } = useAltokkeTheme();

  const modoOscuro =
    variante === "oscuro" ||
    (variante !== "claro" && esOscuro);

  const modoClaro = !modoOscuro;
  const tituloCampo = etiqueta || placeholder || "Campo";

  const fondoCampo = error 
    ? colores.errorFondo
    : enFoco
    ? colores.campoFoco
    : colores.campo;

  return (
    <View style={estilos.wrapper}>
      <View
        style={[
          estilos.campo,
          {
            backgroundColor: fondoCampo,
          },
        ]}
      >
          <View style={estilos.contenido}>
            <Text
              style={[
                estilos.etiqueta,
                {
                  color: error 
                    ? colores.error
                    : enFoco
                    ? colores.exitoTexto
                    : colores.secundario,
                },
              ]}
              numberOfLines={1}
            >
              {tituloCampo}
            </Text>

            <TextInput
              {...rest}
              style={[
                estilos.input,
                {
                  color: colores.textoCampo,
                },
                style,
              ]}
              placeholder=""
              placeholderTextColor={colores.secundario}
              selectionColor={colores.exitoTexto}
              cursorColor={colores.exitoTexto}
              keyboardAppearance={
                modoClaro ? "light" : "dark"
              }
              secureTextEntry={
                esPassword
                  ? !visible
                  : rest.secureTextEntry
              }
              accessibilityLabel={tituloCampo}
              onFocus={(evento) => {
                setEnFoco(true);
                onFocus?.(evento);
              }}
              onBlur={(evento) => {
                setEnFoco(false);
                onBlur?.(evento);
              }}
              underlineColorAndroid="transparent"
            />
          </View>

        {esPassword && (
          <Pressable
            style={estilos.botonOjo}
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Ionicons
              name={visible ? "eye-outline" : "eye-off-outline"}
              size={19}
              color={colores.secundario}
            />
          </Pressable>
        )}
      </View>

      {error && Boolean(textoError) && (
        <View style={estilos.errorFila}>
          <Ionicons name="alert-circle-outline" size={15} color={colores.error} />
          <Text style={[
            estilos.errorTexto,
            { color: colores.error },
          ]}>{textoError}</Text>
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  wrapper: {
    width: "100%",
  },

  campo: {
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 19,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 0,
    gap: 6,
  },

  contenido: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  etiqueta: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
    marginBottom: 0,
  },

  input: {
    minHeight: 20,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "500",
    paddingVertical: 0,
  },

  botonOjo: {
    width: 38,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  errorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 10,
  },

  errorTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default CampoTexto;
