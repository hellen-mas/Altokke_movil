import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ViajeHistorial } from "@/features/viajes/constants/pasajero";
import { formatearFechaHora, formatearSoles } from "@/features/viajes/utils/viaje";
import type { ColoresTema } from "@/shared/theme/useAltokkeTheme";

interface TarjetaViajeHistorialProps {
  viaje: ViajeHistorial;
  colores: ColoresTema;
  onSolicitar: (viaje: ViajeHistorial) => void;
  onReportar: (viajeId: string) => void;
}

export const TarjetaViajeHistorial = React.memo(function TarjetaViajeHistorial({
  viaje,
  colores,
  onSolicitar,
  onReportar,
}: TarjetaViajeHistorialProps) {
  const completado = viaje.estado === "completado";

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.linea,
        },
      ]}
    >
      {/* Fecha y estado */}
      <View style={styles.filaSuperior}>
        <View style={styles.fechaContenedor}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={colores.secundario}
          />

          <Text
            style={[styles.fecha, { color: colores.secundario }]}
            numberOfLines={2}
          >
            {formatearFechaHora(viaje.fecha)}
          </Text>
        </View>

        <View
          style={[
            styles.estadoCaja,
            {
              backgroundColor: completado
                ? colores.exitoFondo
                : colores.errorFondo,
            },
          ]}
        >
          <Ionicons
            name={completado ? "checkmark-circle" : "close-circle"}
            size={14}
            color={completado ? colores.exitoTexto : colores.error}
          />

          <Text
            style={[
              styles.estadoTexto,
              {
                color: completado ? colores.exitoTexto : colores.error,
              },
            ]}
          >
            {completado ? "Completado" : "Cancelado"}
          </Text>
        </View>
      </View>

      {/* Recorrido */}
      <View style={styles.recorrido}>
        <View style={styles.lineaRecorrido}>
          <View
            style={[styles.puntoOrigen, { backgroundColor: colores.exitoTexto }]}
          />
          <View style={[styles.conector, { backgroundColor: colores.linea }]} />
          <View
            style={[
              styles.puntoDestino,
              { borderColor: colores.secundario },
            ]}
          />
        </View>

        <View style={styles.datosRecorrido}>
          <View style={styles.lugarBloque}>
            <Text style={[styles.etiquetaLugar, { color: colores.secundario }]}>
              ORIGEN
            </Text>
            <Text
              style={[styles.lugarTexto, { color: colores.texto }]}
              numberOfLines={2}
            >
              {viaje.origen}
            </Text>
          </View>

          <View style={styles.lugarBloque}>
            <Text style={[styles.etiquetaLugar, { color: colores.secundario }]}>
              DESTINO
            </Text>
            <Text
              style={[styles.lugarTexto, { color: colores.texto }]}
              numberOfLines={2}
            >
              {viaje.destino}
            </Text>
          </View>
        </View>
      </View>

      {/* Tarifa y nueva solicitud */}
      <View
        style={[
          styles.filaAcciones,
          { borderTopColor: colores.linea },
        ]}
      >
        <View style={styles.tarifaBloque}>
          <Text style={[styles.tarifaEtiqueta, { color: colores.secundario }]}>
            {completado ? "TARIFA REGISTRADA" : "TARIFA ESTIMADA"}
          </Text>
          <Text style={[styles.tarifa, { color: colores.texto }]}>
            {formatearSoles(viaje.tarifa)}
          </Text>
        </View>

        <Pressable
          onPress={() => onSolicitar(viaje)}
          accessibilityRole="button"
          accessibilityLabel="Solicitar este viaje de nuevo"
          style={({ pressed }) => [
            styles.botonRepetir,
            {
              backgroundColor: pressed
                ? colores.primarioPresionado
                : colores.primario,
            },
          ]}
        >
          <Ionicons
            name="refresh-outline"
            size={17}
            color={colores.textoBoton}
          />
          <Text style={[styles.repetirTexto, { color: colores.textoBoton }]}>
            Solicitar de nuevo
          </Text>
        </Pressable>
      </View>

      {/* Reportar inconveniente */}
      <Pressable
        onPress={() => onReportar(viaje.id)}
        accessibilityRole="button"
        accessibilityLabel="Reportar un problema con este viaje"
        style={({ pressed }) => [
          styles.filaReportar,
          { borderTopColor: colores.linea },
          pressed && { backgroundColor: colores.campo },
        ]}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={18}
          color={colores.exitoTexto}
        />
        <Text style={[styles.reportarTexto, { color: colores.exitoTexto }]}>
          ¿Tuviste algún problema?
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colores.secundario}
        />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  tarjeta: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 18,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 14,
  },
  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fechaContenedor: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  fecha: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  estadoCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  estadoTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  recorrido: {
    flexDirection: "row",
    gap: 12,
  },
  lineaRecorrido: {
    alignItems: "center",
    width: 14,
    paddingVertical: 3,
  },
  puntoOrigen: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  puntoDestino: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  datosRecorrido: {
    flex: 1,
    gap: 12,
  },
  lugarBloque: {
    gap: 2,
  },
  etiquetaLugar: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  lugarTexto: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  filaAcciones: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  tarifaBloque: {
    gap: 2,
  },
  tarifaEtiqueta: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  tarifa: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  botonRepetir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  repetirTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
  filaReportar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  reportarTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
});
