import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type NombreIconoMenu = keyof typeof Ionicons.glyphMap;

export interface PropsFilaOpcionMenu {
  icono: NombreIconoMenu;
  titulo: string;
  subtitulo?: string;
  descripcion?: string;
  onPress?: () => void;
  variante?: "fila" | "tarjeta";
  peligro?: boolean;
  derecha?: ReactNode;
  sinFlecha?: boolean;
  ultimo?: boolean;
}

export function FilaOpcionMenu({
  icono,
  titulo,
  subtitulo,
  descripcion,
  onPress,
  variante = "fila",
  peligro = false,
  derecha,
  sinFlecha = false,
  ultimo = false,
}: PropsFilaOpcionMenu) {
  const { colores } = useAltokkeTheme();
  const detalle = subtitulo || descripcion;
  const colorIcono = peligro ? colores.error : colores.exitoTexto;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={({ pressed }) => [
        styles.base,
        variante === "tarjeta"
          ? [
              styles.tarjeta,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]
          : [
              styles.fila,
              !ultimo && {
                borderBottomColor: colores.linea,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ],
        pressed && {
          backgroundColor: colores.campo,
        },
      ]}
    >
      <View
        style={[
          styles.iconoContenedor,
          {
            backgroundColor: peligro
              ? `${colores.error}15`
              : colores.exitoFondo,
          },
        ]}
      >
        <Ionicons name={icono} size={20} color={colorIcono} />
      </View>

      <View style={styles.textos}>
        <Text
          style={[
            styles.titulo,
            { color: peligro ? colores.error : colores.texto },
          ]}
          numberOfLines={1}
        >
          {titulo}
        </Text>
        {detalle ? (
          <Text
            style={[styles.descripcion, { color: colores.secundario }]}
            numberOfLines={2}
          >
            {detalle}
          </Text>
        ) : null}
      </View>

      {derecha ? (
        derecha
      ) : !sinFlecha ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colores.secundario}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  fila: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  tarjeta: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconoContenedor: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "600",
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default FilaOpcionMenu;
