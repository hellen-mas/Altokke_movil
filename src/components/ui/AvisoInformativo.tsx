import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { use } from "react";
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
  style,
}: AvisoInformativoProps) {
  const { colores } = useAltokkeTheme();

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: colores.exitoFondo,
          borderWidth: 0,
        },
        style,
      ]}>
      <View 
        style={[
          styles.iconoContainer, 
          { backgroundColor: colores.campo },
        ]}>
        <Ionicons
          name={icono}
          size={19}
          color={colores.exitoTexto}
        />
      </View>

      <View style={styles.informacion}>
        {titulo && (
          <Text style={[styles.titulo, { color: colores.texto }]}>
            {titulo}
          </Text>
        )}
        <Text style={[styles.texto, { color: colores.secundario }]}>
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
  iconoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDEEE5",
  },
  informacion: {
    flex: 1,
  },
  titulo: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  texto: {
    fontSize: 12,
    lineHeight: 17,
  },
});
