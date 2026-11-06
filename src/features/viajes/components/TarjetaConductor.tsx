import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { IconoMototaxi } from "./IconoMototaxi";

export interface InfoConductor {
  nombre?: string;
  calificacion?: number;
  viajes?: number;
  vehiculo?: string;
  placa?: string;
  color?: string;
  foto?: string | null;
}

interface Props {
  conductor?: InfoConductor | null;
}

/** Datos del conductor asignado y de su mototaxi */
export function TarjetaConductor({ conductor }: Props) {
  const { colores } = useAltokkeTheme();

  // Mientras no lleguen datos confirmados, no se inventa ningún conductor
  if (!conductor) {
    return (
      <View style={[styles.tarjeta, { backgroundColor: colores.campo }]}>
        <ActivityIndicator color={colores.exitoTexto} />
        <Text style={[styles.detalle, { color: colores.secundario }]}>
          Cargando datos del conductor...
        </Text>
      </View>
    );
  }

  const calificacion = conductor.calificacion?.toFixed(1) ?? "-";
  const viajes = conductor.viajes ?? 0;
  const vehiculo = conductor.vehiculo ?? "Mototaxi";
  const placa = conductor.placa ?? "Sin placa";

  return (
    <View style={[styles.tarjeta, { backgroundColor: colores.campo }]}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        {conductor.foto ? (
          <Image
            source={{ uri: conductor.foto }}
            style={styles.foto}
            contentFit="cover"
          />
        ) : (
          <Ionicons
            name="person"
            size={26}
            color={colores.secundario}
          />
        )}
      </View>

      <View style={styles.textos}>
        <View style={styles.fila}>
          <Text style={[styles.nombre, { color: colores.texto }]} numberOfLines={1}>
            {conductor.nombre}
          </Text>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={colores.exitoTexto}
          />
        </View>
        <View style={styles.fila}>
          <Ionicons name="star" size={14} color="#F5B301" />
          <Text style={[styles.detalle, { color: colores.secundario }]}>
            {calificacion} · {viajes} viajes
          </Text>
        </View>
      </View>

      <View style={styles.vehiculo}>
        <IconoMototaxi size={30} color={colores.exitoTexto} />
        <Text style={[styles.vehiculoTitulo, { color: colores.texto }]}>
          {vehiculo}
        </Text>
        <Text
          style={[
            styles.vehiculoPlaca,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.secundario,
            },
          ]}
        >
          {placa}
        </Text>
        {conductor.color && (
          <Text style={[styles.vehiculoColor, { color: colores.secundario }]} numberOfLines={1}>
            {conductor.color}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  foto: {
    width: "100%",
    height: "100%",
  },

  textos: {
    flex: 1,
    gap: 3,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  nombre: {
    fontSize: 16,
    fontWeight: "700",
  },

  detalle: {
    fontSize: 13,
  },

  vehiculo: {
    alignItems: "center",
    gap: 2,
    minWidth: 80,
  },

  vehiculoTitulo: {
    fontSize: 12,
    fontWeight: "600",
  },

  vehiculoPlaca: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    letterSpacing: 0.5,
  },

  vehiculoColor: {
    fontSize: 10,
  },
});
