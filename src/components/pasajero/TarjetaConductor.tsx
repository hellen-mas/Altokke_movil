import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { CONDUCTOR_EJEMPLO } from "@/constants/pasajero";
import { paletaColores } from "@/paletaColores";
import { IconoMototaxi } from "./IconoMototaxi";

/** Datos del conductor asignado y de su mototaxi */
export function TarjetaConductor() {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.avatar}>
        <Ionicons
          name="person"
          size={26}
          color={paletaColores.textoSecundarioClaro}
        />
      </View>

      <View style={styles.textos}>
        <View style={styles.fila}>
          <Text style={styles.nombre} numberOfLines={1}>
            {CONDUCTOR_EJEMPLO.nombre}
          </Text>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={paletaColores.boton}
          />
        </View>
        <View style={styles.fila}>
          <Ionicons name="star" size={14} color="#F5B301" />
          <Text style={styles.detalle}>
            {CONDUCTOR_EJEMPLO.calificacion} · {CONDUCTOR_EJEMPLO.viajes} viajes
          </Text>
        </View>
      </View>

      <View style={styles.vehiculo}>
        <IconoMototaxi size={30} color={paletaColores.boton} />
        <Text style={styles.vehiculoTitulo}>{CONDUCTOR_EJEMPLO.vehiculo}</Text>
        <Text style={styles.vehiculoPlaca}>{CONDUCTOR_EJEMPLO.placa}</Text>
        <Text style={styles.vehiculoColor} numberOfLines={1}>
          {CONDUCTOR_EJEMPLO.color}
        </Text>
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
    backgroundColor: "#F3F6F4",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
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
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  detalle: {
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  vehiculo: {
    alignItems: "center",
    maxWidth: 110,
  },

  vehiculoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  vehiculoPlaca: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
    fontSize: 10,
    overflow: "hidden",
    color: paletaColores.textoSecundarioClaro,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  vehiculoColor: {
    marginTop: 2,
    fontSize: 10,
    color: paletaColores.textoSecundarioClaro,
  },
});
