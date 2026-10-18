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
}

export const CampoTexto = ({
  nombreIcono,
  esPassword,
  variante = "oscuro",
  error = false,
  textoError,
  style,
  onFocus,
  onBlur,
  ...rest
}: PropsCampoTexto) => {
  const [visible, setVisible] = useState(false);
  const [enFoco, setEnFoco] = useState(false);

  const esClaro = variante === "claro";
  const colorSecundario = esClaro ? paletaColores.textoSecundarioClaro : paletaColores.textSecondary;
  const colorIcono = error ? paletaColores.error : enFoco ? paletaColores.primary : colorSecundario;

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
            size={24}
            color={colorIcono}
            style={estilos.iconoIzquierdo}
          />
        )}

        <TextInput
          style={[estilos.entrada, esClaro && estilos.entradaClara, style]}
          placeholderTextColor={colorSecundario}
          secureTextEntry={esPassword ? !visible : rest.secureTextEntry}
          accessibilityLabel={rest.placeholder || "Campo de texto"}
          onFocus={(e) => { setEnFoco(true); onFocus?.(e); }}
          onBlur={(e) => { setEnFoco(false); onBlur?.(e); }}
          {...rest}
        />

        {esPassword && (
          <Pressable
            onPress={() => setVisible((prev) => !prev)}
            style={estilos.botonOjo}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Ver contraseña"}
          >
            <Ionicons
              name={visible ? "eye-outline" : "eye-off-outline"}
              size={24}
              color={colorSecundario}
            />
          </Pressable>
        )}
      </View>

      {error && !!textoError && (
        <View style={estilos.filaError}>
          <Ionicons name="alert-circle-outline" size={18} color={paletaColores.error} />
          <Text style={estilos.textoError}>{textoError}</Text>
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  envoltorio: {
    width: "100%",
  },
  contenedor: {
    width: "100%",
    minHeight: 62,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: paletaColores.surfaceBorder,
    borderRadius: 14,
    backgroundColor: paletaColores.surface,
  },
  contenedorClaro: {
    backgroundColor: paletaColores.inputClaro,
    borderColor: paletaColores.bordeClaro,
  },
  contenedorFoco: {
    borderColor: paletaColores.primary,
    backgroundColor: paletaColores.surfaceElevated,
  },
  contenedorError: {
    borderColor: paletaColores.error,
    backgroundColor: paletaColores.errorMuted,
  },
  iconoIzquierdo: {
    marginRight: 2,
  },
  entrada: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    color: paletaColores.textPrimary,
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
    marginLeft: 4,
  },
  textoError: {
    color: paletaColores.error,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
});

export default CampoTexto;
