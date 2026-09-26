import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PASAJERO_DEMO } from "@/constants/cuenta";
import {
  CENTRO_BAGUA,
  LUGARES_BAGUA,
  ORIGEN_EJEMPLO,
} from "@/constants/pasajero";
import { paletaColores } from "@/paletaColores";
import { MapaBase } from "@/components/pasajero/MapaBase";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { router } from "expo-router";

type EstadoSolicitud = "NUEVA" | "ACEPTADA" | "RECHAZADA";

const DESTINO_EJEMPLO =
  LUGARES_BAGUA.find((lugar) => lugar.id === "plaza-heroes-cenepa") ??
  LUGARES_BAGUA[0];

const TARIFA_EJEMPLO = 4.94;
const DISTANCIA_EJEMPLO = "1.3 km";
const TIEMPO_EJEMPLO = "3 min";

export default function SolicitudesConductor() {
  const [estadoSolicitud, setEstadoSolicitud] =
    useState<EstadoSolicitud>("NUEVA");

  const aceptarSolicitud = () => {
    router.push("/viaje-activo" as any)
  }

  const rechazarSolicitud = () => {
    setEstadoSolicitud("RECHAZADA");
  };

  const mostrarOtraSolicitud = () => {
    setEstadoSolicitud("NUEVA");
  };

  return (
    <View style={styles.safeArea}>

      <CabeceraConductor
        titulo="Solicitudes"
        subtitulo="Solicitudes cercanas"
        mostrarMarca
        mostrarAtras={false}
        compacta
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {estadoSolicitud === "NUEVA" && (
          <>
            {/* AVISO */}
            <View style={styles.nuevaSolicitudCard}>
              <View style={styles.nuevaSolicitudIcono}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={paletaColores.superficieClara}
                />
              </View>

              <View style={styles.nuevaSolicitudContenido}>
                <Text style={styles.nuevaSolicitudTitulo}>
                  ¡Nueva solicitud de viaje!
                </Text>

                <Text style={styles.nuevaSolicitudDescripcion}>
                  Tienes una solicitud disponible cerca de tu ubicación.
                </Text>
              </View>

              <View style={styles.tiempoCard}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={paletaColores.verde}
                />
                <Text style={styles.tiempoCardTexto}>00:15</Text>
              </View>
            </View>

            {/* MAPA */}
            <View style={styles.mapaContainer}>
              <MapaBase
                centro={CENTRO_BAGUA}
                origen={ORIGEN_EJEMPLO.coordenadas}
                destino={DESTINO_EJEMPLO.coordenadas}
                interactivo={false}
                style={styles.mapa}
              />
            </View>

            {/* DETALLES */}
            <Text style={styles.seccionTitulo}>Detalles del viaje</Text>

            <View style={styles.detalleCard}>
              {/* PASAJERO */}
              <View style={styles.pasajeroHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>
                    {PASAJERO_DEMO.iniciales}
                  </Text>
                </View>

                <View style={styles.pasajeroInfo}>
                  <Text style={styles.pasajeroNombre}>
                    {PASAJERO_DEMO.nombre}
                  </Text>

                  <View style={styles.calificacionFila}>
                    <Ionicons
                      name="star"
                      size={14}
                      color={paletaColores.advertencia}
                    />

                    <Text style={styles.calificacionTexto}>
                      {PASAJERO_DEMO.calificacion} · {PASAJERO_DEMO.viajes} viajes
                    </Text>
                  </View>
                </View>

                <View style={styles.servicioBadge}>
                  <Text style={styles.servicioTexto}>Normal</Text>
                  <Text style={styles.servicioSubtexto}>Económico</Text>
                </View>
              </View>

              <View style={styles.divisor} />

              {/* RECOGIDA */}
              <View style={styles.ubicacionFila}>
                <View style={styles.iconoUbicacionVerde}>
                  <Ionicons
                    name="radio-button-on"
                    size={17}
                    color={paletaColores.verde}
                  />
                </View>

                <View style={styles.ubicacionContenido}>
                  <Text style={styles.ubicacionEtiqueta}>Recogida</Text>
                  <Text style={styles.ubicacionValor}>
                    {ORIGEN_EJEMPLO.nombre}
                  </Text>
                </View>

                <View style={styles.badgeDistancia}>
                  <Text style={styles.badgeDistanciaTexto}>
                    A 2 min
                  </Text>
                </View>
              </View>

              {/* DESTINO */}
              <View style={styles.ubicacionFila}>
                <View style={styles.iconoUbicacionRojo}>
                  <Ionicons
                    name="location"
                    size={17}
                    color={paletaColores.error}
                  />
                </View>

                <View style={styles.ubicacionContenido}>
                  <Text style={styles.ubicacionEtiqueta}>Destino</Text>
                  <Text style={styles.ubicacionValor}>
                    {DESTINO_EJEMPLO.nombre}
                  </Text>
                </View>
              </View>

              <View style={styles.divisor} />

              {/* DATOS */}
              <View style={styles.datosGrid}>
                <View style={styles.datoCard}>
                  <View style={styles.datoIcono}>
                    <Ionicons
                      name="cash-outline"
                      size={19}
                      color={paletaColores.verde}
                    />
                  </View>

                  <Text style={styles.datoEtiqueta}>
                    Tarifa estimada
                  </Text>

                  <Text style={styles.datoValor}>
                    S/ {TARIFA_EJEMPLO.toFixed(2)}
                  </Text>

                  <Text style={styles.datoDetalle}>
                    Pago en efectivo
                  </Text>
                </View>

                <View style={styles.datoCard}>
                  <View style={styles.datoIcono}>
                    <Ionicons
                      name="navigate-outline"
                      size={19}
                      color={paletaColores.verde}
                    />
                  </View>

                  <Text style={styles.datoEtiqueta}>
                    Distancia
                  </Text>

                  <Text style={styles.datoValor}>
                    {DISTANCIA_EJEMPLO}
                  </Text>

                  <Text style={styles.datoDetalle}>
                    Desde tu ubicación
                  </Text>
                </View>

                <View style={styles.datoCard}>
                  <View style={styles.datoIcono}>
                    <Ionicons
                      name="time-outline"
                      size={19}
                      color={paletaColores.verde}
                    />
                  </View>

                  <Text style={styles.datoEtiqueta}>
                    Tiempo estimado
                  </Text>

                  <Text style={styles.datoValor}>
                    {TIEMPO_EJEMPLO}
                  </Text>

                  <Text style={styles.datoDetalle}>
                    Hasta recoger
                  </Text>
                </View>
              </View>
            </View>

            {/* BOTONES */}
            <View style={styles.botonesContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.botonRechazar,
                  pressed && styles.botonRechazarPresionado,
                ]}
                onPress={rechazarSolicitud}
              >
                <Ionicons
                  name="close"
                  size={19}
                  color={paletaColores.textoClaro}
                />

                <Text style={styles.botonRechazarTexto}>
                  Rechazar
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.botonAceptar,
                  pressed && styles.botonAceptarPresionado,
                ]}
                onPress={aceptarSolicitud}
              >
                <Text style={styles.botonAceptarTexto}>
                  Aceptar viaje
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </>
        )}

        {estadoSolicitud === "ACEPTADA" && (
          <View style={styles.estadoResultadoContainer}>
            <View style={styles.iconoResultadoAceptado}>
              <Ionicons
                name="checkmark-circle"
                size={54}
                color={paletaColores.verde}
              />
            </View>

            <Text style={styles.resultadoTitulo}>
              Viaje aceptado
            </Text>

            <Text style={styles.resultadoDescripcion}>
              Dirígete al punto de recogida del pasajero.
            </Text>

            <View style={styles.resumenAceptado}>
              <View style={styles.resumenFila}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={paletaColores.verde}
                />

                <View style={styles.resumenTextoContainer}>
                  <Text style={styles.resumenEtiqueta}>
                    Pasajero
                  </Text>

                  <Text style={styles.resumenValor}>
                    {PASAJERO_DEMO.nombre}
                  </Text>
                </View>
              </View>

              <View style={styles.resumenFila}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={paletaColores.verde}
                />

                <View style={styles.resumenTextoContainer}>
                  <Text style={styles.resumenEtiqueta}>
                    Punto de recogida
                  </Text>

                  <Text style={styles.resumenValor}>
                    {ORIGEN_EJEMPLO.nombre}
                  </Text>
                </View>
              </View>

              <View style={styles.resumenFila}>
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color={paletaColores.error}
                />

                <View style={styles.resumenTextoContainer}>
                  <Text style={styles.resumenEtiqueta}>
                    Destino
                  </Text>

                  <Text style={styles.resumenValor}>
                    {DESTINO_EJEMPLO.nombre}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.avisoAceptado}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={paletaColores.verde}
              />

              <Text style={styles.avisoAceptadoTexto}>
                La pantalla de viaje activo se conectará en el siguiente paso.
              </Text>
            </View>
          </View>
        )}

        {estadoSolicitud === "RECHAZADA" && (
          <View style={styles.estadoResultadoContainer}>
            <View style={styles.iconoResultadoRechazado}>
              <Ionicons
                name="close-circle"
                size={54}
                color={paletaColores.error}
              />
            </View>

            <Text style={styles.resultadoTitulo}>
              Solicitud rechazada
            </Text>

            <Text style={styles.resultadoDescripcion}>
              La solicitud fue descartada. Puedes esperar una nueva.
            </Text>

            <Pressable
              style={styles.botonNuevaSolicitud}
              onPress={mostrarOtraSolicitud}
            >
              <Ionicons
                name="refresh"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.botonNuevaSolicitudTexto}>
                Simular nueva solicitud
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  tituloPagina: {
    fontSize: 24,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  subtituloPagina: {
    marginTop: 4,
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
  },

  estadoOnline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E8F7F0",
  },

  puntoOnline: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: paletaColores.verde,
  },

  estadoOnlineTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.verde,
  },

  nuevaSolicitudCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#EAF8F1",
    borderWidth: 1,
    borderColor: "#CFECDD",
    marginBottom: 16,
  },

  nuevaSolicitudIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.verde,
    marginRight: 11,
  },

  nuevaSolicitudContenido: {
    flex: 1,
  },

  nuevaSolicitudTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  nuevaSolicitudDescripcion: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: paletaColores.textoSecundarioClaro,
  },

  tiempoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: paletaColores.superficieClara,
  },

  tiempoCardTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: paletaColores.verde,
  },

  mapaContainer: {
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: "#EAF0EC",
    marginBottom: 20,
  },

  mapa: {
    width: "100%",
    height: "100%",
  },

  seccionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: paletaColores.textoClaro,
    marginBottom: 10,
  },

  detalleCard: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },

  pasajeroHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F7F0",
    marginRight: 11,
  },

  avatarTexto: {
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.verde,
  },

  pasajeroInfo: {
    flex: 1,
  },

  pasajeroNombre: {
    fontSize: 15,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  calificacionFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },

  calificacionTexto: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  servicioBadge: {
    alignItems: "flex-end",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#EAF8F1",
  },

  servicioTexto: {
    fontSize: 11,
    fontWeight: "800",
    color: paletaColores.verde,
  },

  servicioSubtexto: {
    marginTop: 1,
    fontSize: 9,
    color: paletaColores.textoSecundarioClaro,
  },

  divisor: {
    height: 1,
    backgroundColor: paletaColores.bordeClaro,
    marginVertical: 14,
  },

  ubicacionFila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  iconoUbicacionVerde: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
    marginRight: 10,
  },

  iconoUbicacionRojo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBEAEA",
    marginRight: 10,
  },

  ubicacionContenido: {
    flex: 1,
  },

  ubicacionEtiqueta: {
    fontSize: 10,
    color: paletaColores.textoSecundarioClaro,
    marginBottom: 2,
  },

  ubicacionValor: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  badgeDistancia: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#EAF8F1",
  },

  badgeDistanciaTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: paletaColores.verde,
  },

  datosGrid: {
    flexDirection: "row",
    gap: 8,
  },

  datoCard: {
    flex: 1,
    padding: 11,
    borderRadius: 12,
    backgroundColor: paletaColores.fondoClaro,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  datoIcono: {
    marginBottom: 6,
  },

  datoEtiqueta: {
    fontSize: 9,
    color: paletaColores.textoSecundarioClaro,
  },

  datoValor: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  datoDetalle: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  botonesContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  botonRechazar: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: paletaColores.superficieClara,
  },

  botonRechazarPresionado: {
    backgroundColor: "#EEF1EF",
  },

  botonRechazarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  botonAceptar: {
    flex: 1.45,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: paletaColores.verde,
  },

  botonAceptarPresionado: {
    backgroundColor: paletaColores.botonPresionado,
  },

  botonAceptarTexto: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  estadoResultadoContainer: {
    marginTop: 60,
    alignItems: "center",
  },

  iconoResultadoAceptado: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
    marginBottom: 18,
  },

  iconoResultadoRechazado: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBEAEA",
    marginBottom: 18,
  },

  resultadoTitulo: {
    fontSize: 24,
    fontWeight: "800",
    color: paletaColores.textoClaro,
    textAlign: "center",
  },

  resultadoDescripcion: {
    maxWidth: 300,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: paletaColores.textoSecundarioClaro,
  },

  resumenAceptado: {
    width: "100%",
    marginTop: 26,
    padding: 16,
    borderRadius: 18,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    gap: 16,
  },

  resumenFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  resumenTextoContainer: {
    flex: 1,
  },

  resumenEtiqueta: {
    fontSize: 10,
    color: paletaColores.textoSecundarioClaro,
  },

  resumenValor: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  avisoAceptado: {
    width: "100%",
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#EAF8F1",
  },

  avisoAceptadoTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: paletaColores.textoSecundarioClaro,
  },

  botonNuevaSolicitud: {
    marginTop: 24,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: paletaColores.verde,
  },

  botonNuevaSolicitudTexto: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});