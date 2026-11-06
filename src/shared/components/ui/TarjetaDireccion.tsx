import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export interface PropsTarjetaDireccion {
  nombre: string;
  direccion: string;
  icono?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  mostrarSeparador?: boolean;
}

export function TarjetaDireccion({
  nombre,
  direccion,
  icono = "location-outline",
  onPress,
  mostrarSeparador = false,
}: PropsTarjetaDireccion) {
  const { colores } = useAltokkeTheme();

  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Opciones para ${nombre}`}
        style={({ pressed }) => [
          styles.filaDireccion,
          pressed && {
            backgroundColor: colores.campo,
          },
        ]}
      >
        <View
          style={[
            styles.iconoFondo,
            { backgroundColor: colores.exitoFondo },
          ]}
        >
          <Ionicons
            name={icono}
            size={22}
            color={colores.exitoTexto}
          />
        </View>

        <View style={styles.textos}>
          <Text
            style={[styles.nombre, { color: colores.texto }]}
            numberOfLines={1}
          >
            {nombre}
          </Text>

          <Text
            style={[
              styles.direccion,
              { color: colores.secundario },
            ]}
            numberOfLines={2}
          >
            {direccion}
          </Text>
        </View>

        <Ionicons
          name="ellipsis-horizontal"
          size={22}
          color={colores.secundario}
        />
      </Pressable>

      {mostrarSeparador && (
        <View
          style={[
            styles.separadorDireccion,
            { backgroundColor: colores.linea },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filaDireccion: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconoFondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 3,
  },
  nombre: {
    fontSize: 15,
    fontWeight: "700",
  },
  direccion: {
    fontSize: 13,
    lineHeight: 18,
  },
  separadorDireccion: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 74,
    marginRight: 16,
  },
});

export default TarjetaDireccion;
