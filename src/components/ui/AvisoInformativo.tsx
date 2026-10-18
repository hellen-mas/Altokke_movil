import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface AvisoInformativoProps {
  texto: string;
  titulo?: string;
  icono?: keyof typeof Ionicons.glyphMap;
  variante?: "claro" | "oscuro";
  style?: StyleProp<ViewStyle>;
}

export function AvisoInformativo({
  texto,
  titulo,
  icono = "shield-checkmark-outline",
  variante = "claro",
  style,
}: AvisoInformativoProps) {
  const esOscuro = variante === "oscuro";

  return (
    <View style={[styles.container, esOscuro && styles.containerOscuro, style]}>
      <View style={[styles.iconoContainer, esOscuro && styles.iconoContainerOscuro]}>
        <Ionicons
          name={icono}
          size={esOscuro ? 22 : 19}
          color={esOscuro ? paletaColores.boton : paletaColores.verde}
        />
      </View>

      <View style={styles.informacion}>
        {titulo && (
          <Text style={[styles.titulo, esOscuro && styles.tituloOscuro]}>
            {titulo}
          </Text>
        )}
        <Text style={[styles.texto, esOscuro && styles.textoOscuro]}>
          {texto}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#EAF5EF",
  },
  containerOscuro: {
    backgroundColor: "#13231B",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "rgba(46, 206, 121, 0.2)",
  },
  iconoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDEEE5",
  },
  iconoContainerOscuro: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(46, 206, 121, 0.15)",
  },
  informacion: {
    flex: 1,
  },
  titulo: {
    color: paletaColores.textoClaro,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  tituloOscuro: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  texto: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    lineHeight: 17,
  },
  textoOscuro: {
    color: "#C2D4CB",
    fontSize: 13.5,
    lineHeight: 19,
  },
});
