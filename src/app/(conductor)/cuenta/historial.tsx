import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import {
  RESUMEN_HISTORIAL,
  VIAJES_EJEMPLO,
} from "@/constants/conductor";
import { paletaColores } from "@/paletaColores";

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type FiltroHistorial = "Todos" | "Hoy" | "Semana" | "Mes";

export default function HistorialConductorScreen() {
  const [filtro, setFiltro] =
    useState<FiltroHistorial>("Todos");

  const viajesFiltrados = VIAJES_EJEMPLO.filter((viaje) => {
    if (filtro === "Todos") return true;

    if (filtro === "Hoy") {
      return viaje.fecha === "Hoy";
    }

    // Temporal para la demo.
    // Luego Semana y Mes vendrán filtrados desde backend.
    return true;
  });

  return (
    <View style={styles.pantalla}>
      <CabeceraConductor
        titulo="Historial"
        subtitulo="Tus viajes y actividad"
        mostrarAtras
        compacta
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* RESUMEN */}
        <View style={styles.resumenCard}>
          <View style={styles.resumenColumna}>
            <View style={styles.resumenIcono}>
              <Ionicons
                name="time-outline"
                size={22}
                color={paletaColores.verde}
              />
            </View>

            <View style={styles.resumenTextos}>
              <Text style={styles.resumenEtiqueta}>
                Total de viajes
              </Text>

              <Text style={styles.resumenValor}>
                {RESUMEN_HISTORIAL.totalViajes}
              </Text>

              <Text style={styles.resumenDetalle}>
                viajes completados
              </Text>
            </View>
          </View>

          <View style={styles.divisorResumen} />

          <View style={styles.resumenColumna}>
            <View style={styles.resumenIcono}>
              <Ionicons
                name="wallet"
                size={21}
                color={paletaColores.verde}
              />
            </View>

            <View style={styles.resumenTextos}>
              <Text style={styles.resumenEtiqueta}>
                Total ganado
              </Text>

              <Text style={styles.resumenValor}>
                S/ {RESUMEN_HISTORIAL.totalGanado.toFixed(2)}
              </Text>

              <Text style={styles.resumenDetalle}>
                en este periodo
              </Text>
            </View>
          </View>
        </View>

        {/* FILTROS */}
        <View style={styles.filtros}>
          {(["Todos", "Hoy", "Semana", "Mes"] as FiltroHistorial[]).map(
            (item) => {
              const activo = filtro === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.filtro,
                    activo && styles.filtroActivo,
                  ]}
                  onPress={() => setFiltro(item)}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      activo && styles.filtroTextoActivo,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {/* VIAJES */}
        <View style={styles.lista}>
          {viajesFiltrados.map((viaje) => (
            <View
              key={viaje.id}
              style={styles.viajeCard}
            >
              {/* FECHA */}
              <View style={styles.fechaBloque}>
                <Text style={styles.fechaPrincipal}>
                  {viaje.fecha}
                </Text>

                <Text style={styles.fechaSecundaria}>
                  {obtenerFechaSecundaria(viaje.fecha)}
                </Text>
              </View>

              {/* RUTA */}
              <View style={styles.viajeCentro}>
                <Text style={styles.hora}>
                  {viaje.hora}
                </Text>

                <View style={styles.rutaFila}>
                  <View style={styles.puntoVerde} />

                  <Text
                    style={styles.rutaTexto}
                    numberOfLines={1}
                  >
                    {viaje.origen}
                  </Text>
                </View>

                <View style={styles.lineaRuta} />

                <View style={styles.rutaFila}>
                  <Ionicons
                    name="location"
                    size={13}
                    color="#F2495C"
                  />

                  <Text
                    style={styles.rutaTexto}
                    numberOfLines={1}
                  >
                    {viaje.destino}
                  </Text>
                </View>
              </View>

              {/* MONTO / ESTADO */}
              <View style={styles.viajeDerecha}>
                <View style={styles.montoFila}>
                  <Text style={styles.monto}>
                    S/ {viaje.monto.toFixed(2)}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={paletaColores.textoSecundarioClaro}
                  />
                </View>

                <View style={styles.estadoBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={paletaColores.verde}
                  />

                  <Text style={styles.estadoTexto}>
                    Completado
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {viajesFiltrados.length === 0 && (
          <View style={styles.vacio}>
            <Ionicons
              name="car-outline"
              size={40}
              color={paletaColores.textoSecundarioClaro}
            />

            <Text style={styles.vacioTitulo}>
              No hay viajes
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function obtenerFechaSecundaria(fecha: string) {
  if (fecha === "Hoy") {
    return "12 Mar";
  }

  if (fecha === "Ayer") {
    return "11 Mar";
  }

  if (fecha === "10 Mar") {
    return "Lun";
  }

  return "";
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 32,
  },

  resumenCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 16,
  },

  resumenColumna: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
  },

  resumenIcono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  resumenTextos: {
    flex: 1,
  },

  resumenEtiqueta: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  resumenValor: {
    marginTop: 1,
    fontSize: 20,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  resumenDetalle: {
    marginTop: 1,
    fontSize: 10,
    color: paletaColores.textoSecundarioClaro,
  },

  divisorResumen: {
    width: 1,
    height: 54,
    backgroundColor: paletaColores.bordeClaro,
    marginHorizontal: 14,
  },

  filtros: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  filtro: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#D5DDD8",
    backgroundColor: paletaColores.superficieClara,
    alignItems: "center",
    justifyContent: "center",
  },

  filtroActivo: {
    backgroundColor: paletaColores.verde,
    borderColor: paletaColores.verde,
  },

  filtroTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.textoSecundarioClaro,
  },

  filtroTextoActivo: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  lista: {
    gap: 8,
  },

  viajeCard: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: paletaColores.superficieClara,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E7E4",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  /* Fecha izquierda */

  fechaBloque: {
    width: 52,
    paddingRight: 8,
  },

  fechaPrincipal: {
    fontSize: 13,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  fechaSecundaria: {
    marginTop: 2,
    fontSize: 10,
    color: "#8A9B94",
  },

  /* Centro */

  viajeCentro: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  hora: {
    fontSize: 12,
    fontWeight: "800",
    color: paletaColores.textoClaro,
    marginBottom: 5,
  },

  rutaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  puntoVerde: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#17B56B",
    marginHorizontal: 2,
  },

  rutaTexto: {
    flex: 1,
    fontSize: 10.5,
    color: paletaColores.textoClaro,
  },

  lineaRuta: {
    width: 1,
    height: 6,
    backgroundColor: "#D9DEDB",
    marginLeft: 6,
    marginVertical: 1,
  },

  /* Derecha */
  viajeDerecha: {
    minWidth: 84,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  montoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  monto: {
    fontSize: 13,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: "#E6F7ED",
    marginTop: 13,
  },

  estadoTexto: {
    fontSize: 9,
    fontWeight: "700",
    color: paletaColores.verde,
  },

  /* Vacío */
  vacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },

  vacioTitulo: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.textoSecundarioClaro,
  },
});