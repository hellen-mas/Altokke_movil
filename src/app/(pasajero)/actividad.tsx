import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInferior } from "@/components/pasajero/BarraInferior";
import { CabeceraPasajero } from "@/components/pasajero/CabeceraPasajero";
import {
  COLOR_CABECERA,
  LUGARES_BAGUA,
  ViajeHistorial,
} from "@/constants/pasajero";
import { useViaje } from "@/context/ViajeContext";
import { paletaColores } from "@/paletaColores";
import { formatearFechaHora, formatearSoles } from "@/utils/viaje";

type Filtro = "todos" | "completado" | "cancelado";

const FILTROS: { id: Filtro; titulo: string }[] = [
  { id: "todos", titulo: "Todos" },
  { id: "completado", titulo: "Completados" },
  { id: "cancelado", titulo: "Cancelados" },
];

const MENSAJE_VACIO: Record<Filtro, string> = {
  todos: "Todavía no tienes viajes.",
  completado: "No tienes viajes completados.",
  cancelado: "No tienes viajes cancelados.",
};

export default function PantallaActividad() {
  const { historial, setDestino } = useViaje();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const viajes =
    filtro === "todos"
      ? historial
      : historial.filter((viaje) => viaje.estado === filtro);

  // Pide otra vez el mismo viaje: si se conoce el destino se pasa directo a
  // confirmar, si no se vuelve a elegir
  const solicitarDeNuevo = (viaje: ViajeHistorial) => {
    const lugar =
      viaje.lugarDestino ??
      LUGARES_BAGUA.find((candidato) => candidato.nombre === viaje.destino);

    if (lugar) {
      setDestino(lugar);
      router.push("/confirmar-viaje");
    } else {
      setDestino(null);
      router.push("/destino");
    }
  };

  return (
    <View style={styles.pantalla}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <CabeceraPasajero subtitulo="Tu movilidad en buenas manos" />

        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Actividad</Text>
          <Text style={styles.subtitulo}>Tus viajes recientes</Text>
        </View>

        {/* Filtros */}
        <View style={styles.filtros}>
          {FILTROS.map((opcion) => {
            const activo = opcion.id === filtro;

            return (
              <Pressable
                key={opcion.id}
                onPress={() => setFiltro(opcion.id)}
                style={[styles.filtro, activo && styles.filtroActivo]}
              >
                <Text
                  style={[styles.filtroTexto, activo && styles.filtroTextoActivo]}
                >
                  {opcion.titulo}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Viajes */}
        <View style={styles.lista}>
          {viajes.length === 0 && (
            <View style={styles.vacio}>
              <Ionicons
                name="time-outline"
                size={40}
                color={paletaColores.deshabilitado}
              />
              <Text style={styles.vacioTexto}>{MENSAJE_VACIO[filtro]}</Text>
            </View>
          )}

          {viajes.map((viaje) => {
            const completado = viaje.estado === "completado";

            return (
              <View key={viaje.id} style={styles.tarjeta}>
                <View style={styles.filaSuperior}>
                  <Text style={styles.fecha}>
                    {formatearFechaHora(viaje.fecha)}
                  </Text>
                  <Text
                    style={[
                      styles.estado,
                      completado ? styles.estadoCompletado : styles.estadoCancelado,
                    ]}
                  >
                    {completado ? "Completado" : "Cancelado"}
                  </Text>
                </View>

                <View style={styles.cuerpo}>
                  <View style={styles.recorrido}>
                    <View style={styles.filaLugar}>
                      <View style={styles.puntoOrigen} />
                      <Text style={styles.lugar} numberOfLines={1}>
                        {viaje.origen}
                      </Text>
                    </View>
                    <View style={styles.filaLugar}>
                      <View style={styles.puntoDestino} />
                      <Text style={styles.lugar} numberOfLines={1}>
                        {viaje.destino}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.derecha}>
                    <Text
                      style={[
                        styles.tarifa,
                        !completado && styles.tarifaCancelada,
                      ]}
                    >
                      {formatearSoles(viaje.tarifa)}
                    </Text>

                    <Pressable
                      onPress={() => solicitarDeNuevo(viaje)}
                      style={({ pressed }) => [
                        styles.repetir,
                        pressed && styles.repetirPresionado,
                      ]}
                    >
                      <Ionicons
                        name="refresh"
                        size={14}
                        color={paletaColores.boton}
                      />
                      <Text style={styles.repetirTexto}>Solicitar de nuevo</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BarraInferior activa="actividad" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    paddingBottom: 16,
  },

  encabezado: {
    marginTop: 16,
    marginHorizontal: 16,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  subtitulo: {
    fontSize: 14,
    color: paletaColores.textoSecundarioClaro,
  },

  filtros: {
    flexDirection: "row",
    marginTop: 14,
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#E9EEEB",
  },

  filtro: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },

  filtroActivo: {
    backgroundColor: COLOR_CABECERA,
  },

  filtroTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: paletaColores.textoSecundarioClaro,
  },

  filtroTextoActivo: {
    color: paletaColores.texto,
  },

  lista: {
    gap: 10,
    marginTop: 14,
    marginHorizontal: 16,
  },

  vacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 48,
  },

  vacioTexto: {
    fontSize: 14,
    color: paletaColores.textoSecundarioClaro,
  },

  tarjeta: {
    padding: 12,
    gap: 10,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  fecha: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    color: paletaColores.textoSecundarioClaro,
  },

  estado: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  estadoCompletado: {
    color: paletaColores.botonPresionado,
    backgroundColor: "#E5F8EF",
  },

  estadoCancelado: {
    color: paletaColores.error,
    backgroundColor: "#FDECEC",
  },

  cuerpo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  recorrido: {
    flex: 1,
    gap: 12,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  puntoOrigen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: paletaColores.boton,
  },

  puntoDestino: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: paletaColores.textoSecundarioClaro,
  },

  lugar: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  derecha: {
    alignItems: "flex-end",
    gap: 8,
  },

  tarifa: {
    fontSize: 17,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  tarifaCancelada: {
    color: paletaColores.textoSecundarioClaro,
    textDecorationLine: "line-through",
  },

  repetir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EAF8F1",
  },

  repetirPresionado: {
    backgroundColor: "#D5F0E3",
  },

  repetirTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: paletaColores.botonPresionado,
  },
});
