import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { RESUMEN_HISTORIAL, VIAJES_EJEMPLO } from "@/constants/conductor";
import { paletaColores } from "@/paletaColores";
import type { EstadoViaje } from "@/types/conductor";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Filtro = "todos" | EstadoViaje;

const FILTROS: { id: Filtro; titulo: string }[] = [
  { id: "todos", titulo: "Todos" },
  { id: "Completado", titulo: "Completados" },
  { id: "Cancelado", titulo: "Cancelados" },
];

export default function HistorialConductor() {
  const [filtro, setFiltro] = useState<Filtro>("todos");

    const viajesFiltrados = [...VIAJES_EJEMPLO]
    .reverse()
    .filter((viaje) => filtro === "todos" || viaje.estado === filtro);

  return (
    <View style={styles.container}>
      <CabeceraConductor
        titulo="Historial"
        subtitulo="Tus viajes y actividades"
        mostrarAtras
        compacta
      />

      <View style={styles.resumen}>
        <View style={styles.resumenDato}>
          <Text style={styles.resumenValor}>
            {RESUMEN_HISTORIAL.totalViajes}
          </Text>
          <Text style={styles.resumenEtiqueta}>Total de viajes</Text>
        </View>

        <View style={styles.separadorVertical} />

        <View style={styles.resumenDato}>
          <Text style={styles.resumenValor}>
            S/ {RESUMEN_HISTORIAL.totalGanado.toFixed(2)}
          </Text>
          <Text style={styles.resumenEtiqueta}>Total ganado</Text>
        </View>
      </View>

      <View style={styles.filtros}>
        {FILTROS.map((opcion) => {
          const activo = opcion.id === filtro;

          return (
            <Pressable
              key={opcion.id}
              style={[styles.filtro, activo && styles.filtroActivo]}
              onPress={() => setFiltro(opcion.id)}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  activo && styles.filtroTextoActivo,
                ]}
              >
                {opcion.titulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {viajesFiltrados.length === 0 ? (
          <Text style={styles.sinResultados}>
            No hay viajes con este filtro.
          </Text>
        ) : (
          viajesFiltrados.map((viaje) => (
            <View key={viaje.id} style={styles.tarjetaViaje}>
              <View style={styles.filaSuperior}>
                <Text style={styles.fecha}>
                  {viaje.fecha}, {viaje.hora}
                </Text>

                <View
                  style={[
                    styles.estado,
                    viaje.estado === "Cancelado" && styles.estadoCancelado,
                  ]}
                >
                  <Ionicons
                    name={
                      viaje.estado === "Completado"
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={13}
                    color={
                      viaje.estado === "Completado"
                        ? paletaColores.boton
                        : paletaColores.error
                    }
                  />
                  <Text
                    style={[
                      styles.estadoTexto,
                      viaje.estado === "Cancelado" &&
                        styles.estadoTextoCancelado,
                    ]}
                  >
                    {viaje.estado}
                  </Text>
                </View>
              </View>

              <View style={styles.ruta}>
                <View style={styles.puntoOrigen} />
                <Text style={styles.rutaTexto} numberOfLines={1}>
                  {viaje.origen}
                </Text>
              </View>

              <View style={styles.rutaLinea} />

              <View style={styles.ruta}>
                <View style={styles.puntoDestino} />
                <Text style={styles.rutaTexto} numberOfLines={1}>
                  {viaje.destino}
                </Text>
              </View>

              <View style={styles.filaInferior}>
                <Text style={styles.monto}>S/ {viaje.monto.toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  resumen: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },

  resumenDato: {
    flex: 1,
    alignItems: "center",
  },

  separadorVertical: {
    width: 1,
    backgroundColor: paletaColores.bordeClaro,
  },

  resumenValor: {
    fontSize: 18,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  resumenEtiqueta: {
    marginTop: 2,
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  filtros: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
  },

  filtro: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  filtroActivo: {
    backgroundColor: paletaColores.boton,
    borderColor: paletaColores.boton,
  },

  filtroTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: paletaColores.textoSecundarioClaro,
  },

  filtroTextoActivo: {
    color: "#FFFFFF",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
  },

  sinResultados: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
  },

  tarjetaViaje: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },

  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  fecha: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  estado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#E6F5EC",
  },

  estadoCancelado: {
    backgroundColor: "#FBEAEA",
  },

  estadoTexto: {
    fontSize: 11,
    fontWeight: "600",
    color: paletaColores.boton,
  },

  estadoTextoCancelado: {
    color: paletaColores.error,
  },

  ruta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  puntoOrigen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: paletaColores.boton,
  },

  puntoDestino: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: paletaColores.error,
  },

  rutaLinea: {
    width: 1,
    height: 14,
    marginLeft: 3.5,
    backgroundColor: paletaColores.bordeClaro,
  },

  rutaTexto: {
    flex: 1,
    fontSize: 13,
    color: paletaColores.textoClaro,
  },

  filaInferior: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: paletaColores.bordeClaro,
    alignItems: "flex-end",
  },

  monto: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },
});