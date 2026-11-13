import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { sanitizarTelefono } from "@/shared/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

export interface PropsCampoTelefonoPeru {
  valor: string;
  alCambiarTexto: (valorSanitizado: string) => void;
  error?: boolean;
  mensajeError?: string;
  placeholder?: string;
  deshabilitado?: boolean;
  estiloContenedor?: ViewStyle;
}

export function CampoTelefonoPeru({
  valor,
  alCambiarTexto,
  error = false,
  mensajeError = "Ingresa un celular peruano válido de 9 dígitos.",
  placeholder = "Número de celular",
  deshabilitado = false,
  estiloContenedor,
}: PropsCampoTelefonoPeru) {
  const { colores, esOscuro } = useAltokkeTheme();
  const [enFoco, setEnFoco] = useState(false);

  const manejarCambio = (texto: string) => {
    const limpio = sanitizarTelefono(texto);
    alCambiarTexto(limpio);
  };

  const colorBorde = error
    ? colores.error
    : enFoco
    ? colores.exitoTexto
    : colores.linea;

  const colorIcono = error
    ? colores.error
    : enFoco
    ? colores.exitoTexto
    : colores.secundario;

  return (
    <View style={[styles.contenedorRaiz, estiloContenedor]}>
      <View
        style={[
          styles.campoFila,
          {
            backgroundColor: colores.campo,
            borderColor: colorBorde,
          },
        ]}
      >
        <Ionicons name="call-outline" size={22} color={colorIcono} />

        <Text style={[styles.prefijo, { color: colores.textoCampo }]}>
          +51
        </Text>

        <View style={[styles.separador, { backgroundColor: colores.linea }]} />

        <TextInput
          style={[styles.input, { color: colores.textoCampo }]}
          placeholder={placeholder}
          placeholderTextColor={colores.secundario}
          value={valor}
          onChangeText={manejarCambio}
          onFocus={() => setEnFoco(true)}
          onBlur={() => setEnFoco(false)}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          keyboardAppearance={esOscuro ? "dark" : "light"}
          maxLength={15}
          editable={!deshabilitado}
          accessibilityLabel={placeholder}
        />
      </View>

      {error && (
        <View style={styles.contenedorError}>
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colores.error}
          />
          <Text style={[styles.textoError, { color: colores.error }]}>
            {mensajeError}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorRaiz: {
    width: "100%",
  },
  campoFila: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    gap: 10,
  },
  prefijo: {
    fontSize: 16,
    fontWeight: "600",
  },
  separador: {
    width: 1,
    height: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    fontVariant: ["tabular-nums"],
  },
  contenedorError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  textoError: {
    fontSize: 13,
  },
});

export default CampoTelefonoPeru;
