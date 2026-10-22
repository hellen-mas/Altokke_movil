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
  variante?: "oscuro" | "claro" | string;
  error?: boolean;
  textoError?: string;
  etiqueta?: string;
  conBotonLimpiar?: boolean;
}

export const CampoTexto = ({
  nombreIcono,
  esPassword = false,
  variante = "oscuro",
  error = false,
  textoError,
  etiqueta,
  conBotonLimpiar = false,
  placeholder,
  style,
  onFocus,
  onBlur,
  ...rest
}: PropsCampoTexto) => {
  const [visible, setVisible] = useState(false);
  const [enFoco, setEnFoco] = useState(false);

  const esClaro = variante === "claro";
  const colorSecundario = esClaro
    ? "#878E89"
    : paletaColores.textSecondary;
  const tituloCampo = etiqueta || placeholder || "Campo";
  const mostrarLimpiar = conBotonLimpiar && !esPassword && Boolean(rest.value);
  return (
    <View style={estilos.wrapper}>
      <View
        style={[
          estilos.campo,
          esClaro && estilos.campoClaro,
          enFoco && (
            esClaro
              ? estilos.campoClaroFoco
              : estilos.campoOscuroFoco
          ),
          error && estilos.campoError,
        ]}
      >
        {esClaro ? (
          <View style={estilos.contenidoClaro}>
            <Text
              style={[
                estilos.etiqueta,
                enFoco && estilos.etiquetaFoco,
                error && estilos.etiquetaError,
              ]}
              numberOfLines={1}
            >
              {tituloCampo}
            </Text>

            <TextInput
              {...rest}
              style={[
                estilos.input,
                estilos.inputClaro,
                style,
              ]}
              placeholder=""
              placeholderTextColor={colorSecundario}
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
              selectionColor={paletaColores.primary}
              underlineColorAndroid="transparent"
            />
          </View>
        ) : (
          <>
            {nombreIcono && (
              <Ionicons
                name={nombreIcono}
                size={22}
                color={
                  error
                    ? paletaColores.error
                    : enFoco
                      ? paletaColores.primary
                      : colorSecundario
                }
              />
            )}

            <TextInput
              {...rest}
              style={[estilos.input, style]}
              placeholder={placeholder}
              placeholderTextColor={colorSecundario}
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
            />
          </>
        )}
        {mostrarLimpiar && (
          <Pressable
            style={estilos.botonOjo}
            onPress={() => rest.onChangeText?.("")}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Borrar ${tituloCampo}`}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colorSecundario}
            />
          </Pressable>
        )}

        {esPassword && (
          <Pressable
            style={estilos.botonOjo}
            onPress={() => setVisible((v) => !v)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Ionicons
              name={visible ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colorSecundario}
            />
          </Pressable>
        )}
      </View>

      {error && Boolean(textoError) && (
        <View style={estilos.errorFila}>
          <Ionicons name="alert-circle-outline" size={15} color={paletaColores.error} />
          <Text style={estilos.errorTexto}>{textoError}</Text>
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
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: paletaColores.surface,
  },

  campoClaro: {
    minHeight: 58,
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 30,
    backgroundColor: "#E9EEEA",
    paddingHorizontal: 19,
    paddingVertical: 6,
    gap: 0,
  },

  campoClaroFoco: {
    backgroundColor: "#E7ECE8",
    borderWidth: 0,
    borderColor: "transparent",
  },

  campoOscuroFoco: {
    borderColor: paletaColores.primary,
  },

  campoError: {
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "#F6EDED",
  },

  contenidoClaro: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  etiqueta: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
    color: "#596C60",
    marginBottom: 0,
  },

  etiquetaFoco: {
    color: "#16804D",
  },

  etiquetaError: {
    color: paletaColores.error,
  },

  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: paletaColores.textPrimary,
    paddingVertical: 0,
  },

  inputClaro: {
    flex: 0,
    minHeight: 20,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: "#17251C",
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
    color: paletaColores.error,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default CampoTexto;
