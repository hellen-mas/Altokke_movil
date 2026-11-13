import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface PropsTarjetaDatosVerificados {
  nombreCompleto: string;
  titulo?: string;
}

export function TarjetaDatosVerificados({
  nombreCompleto,
  titulo = "Datos verificados",
}: PropsTarjetaDatosVerificados) {
  const { colores } = useAltokkeTheme();

  return (
    <View
      style={[
        styles.tarjetaVerificada,
        {
          backgroundColor: colores.exitoFondo,
          borderColor: colores.linea,
        },
      ]}
    >
      <View style={styles.cabeceraVerificada}>
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={colores.primario}
        />
        <Text style={[styles.tituloVerificado, { color: colores.exitoTexto }]}>
          {titulo}
        </Text>
      </View>

      <Text style={[styles.nombreVerificado, { color: colores.texto }]}>
        {nombreCompleto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjetaVerificada: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  cabeceraVerificada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  tituloVerificado: {
    fontSize: 14,
    fontWeight: "600",
  },
  nombreVerificado: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default TarjetaDatosVerificados;
