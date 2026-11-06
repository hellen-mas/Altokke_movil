import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraFlujoViaje } from "@/features/viajes/components/CabeceraFlujoViaje";
import { PanelDeslizableViaje } from "@/features/viajes/components/PanelDeslizableViaje";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { TarjetaConductor } from "@/features/viajes/components/TarjetaConductor";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import {
  CENTRO_BAGUA,
} from "@/features/viajes/constants/pasajero";
import { useViajeStore } from "@/features/viajes/store/viajeStore";
import { viajeService } from "@/features/viajes/services/viajeService";
import { useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useCancelarViaje } from "@/features/viajes/hooks/use-cancelar-viaje";
import { useViajeEnVivo } from "@/features/viajes/hooks/use-viaje-en-vivo";
import { useConductorViaje } from "@/features/viajes/hooks/use-conductor-viaje";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  formatearHora,
  formatearSoles,
  interpolarRuta,
} from "@/features/viajes/utils/viaje";
import { escribirConductor, llamarConductor } from "@/features/viajes/utils/contacto";

// Estados reales del viaje, en el orden en que avanza la barra de progreso
const ESTADOS_PROGRESO = [
  "aceptado",
  "en_camino_origen",
  "esperando_pasajero",
  "en_viaje",
  "finalizado",
];

const ETAPAS = ["Aceptado", "En camino", "Te espera", "En viaje", "Llegaste"];

const SUBTITULOS_ETAPA = [
  "Tu conductor aceptó el viaje",
  "Tu conductor va hacia ti",
  "Tu conductor te está esperando",
  "En camino a tu destino",
  "Llegaste a tu destino",
];

// Posición aproximada del mototaxi sobre la ruta mientras no haya ubicación real
const AVANCE_POR_ETAPA = [0, 0, 0, 0.5, 1];

// Cada cuánto se pregunta la ubicación del conductor mientras dura el viaje
const REFRESCO_UBICACION_MS = 5000;

export default function PantallaViajeActivo() {
  const { colores } = useAltokkeTheme();
  const viajeActivoId = useViajeStore((s) => s.viajeActivoId);
  const resumen = useResumenViaje();
  const [horaSalida] = useState(() => new Date());

  const { viaje, conectado } = useViajeEnVivo(viajeActivoId);
  const conductor = useConductorViaje(
    viajeActivoId,
    viaje?.conductor_id,
    REFRESCO_UBICACION_MS
  );

  const estadoViaje = viaje?.estado ?? "aceptado";
  const etapa = Math.max(0, ESTADOS_PROGRESO.indexOf(estadoViaje));
  const terminado = estadoViaje === "finalizado";

  const { solicitarCancelacion, cancelando, esCancelable } =
    useCancelarViaje(estadoViaje);

  // Si se entra sin haber armado un viaje, se vuelve a pedir el destino
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const { origen, origenLugar, destino, tarifa, minutos, ruta } = resumen;

  // Si el conductor envía su ubicación se usa esa; si no, una posición aproximada sobre la ruta
  const ubicacionReal =
    conductor?.lat != null && conductor?.lng != null
      ? { latitude: conductor.lat, longitude: conductor.lng }
      : null;
  const posicionMoto =
    ubicacionReal ?? interpolarRuta(ruta, AVANCE_POR_ETAPA[etapa]);

  const horaLlegada = new Date(horaSalida.getTime() + minutos * 60000);

  const compartirViaje = () => {
    Share.share({
      message: `Sigue mi viaje en Altokke: voy de ${origenLugar.nombre} a ${destino.nombre}. Llegada estimada: ${formatearHora(horaLlegada)}.`,
    }).catch((err) => {
      console.warn("Aviso al compartir viaje:", err);
    });
  };

  const calificarViaje = () => {
    if (viajeActivoId) {
      viajeService
        .finalizarViaje(viajeActivoId, tarifa)
        .catch((err) => {
          console.warn("Aviso al finalizar viaje:", err);
        });
    }
    router.replace("/calificacion");
  };

  return (
    <GestureHandlerRootView style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <CabeceraFlujoViaje
        titulo={terminado ? "Viaje finalizado" : "Viaje en curso"}
        subtitulo={SUBTITULOS_ETAPA[etapa]}
        mostrarRegreso={false}
      >
        {/* Progreso del viaje */}
        <View style={styles.progreso}>
          <View style={styles.pasos}>
            <View style={styles.pista}>
              <View
                style={[
                  styles.pistaRelleno,
                  {
                    width: `${(etapa / (ETAPAS.length - 1)) * 100}%`,
                    backgroundColor: colores.primario,
                  },
                ]}
              />
            </View>

            {ETAPAS.map((nombre, indice) => (
              <View key={nombre} style={styles.paso}>
                <View
                  style={[
                    styles.punto,
                    indice <= etapa && {
                      backgroundColor: colores.primario,
                      borderColor: colores.primario,
                    },
                    indice === etapa && {
                      borderColor: colores.exitoTexto,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.pasoTexto,
                    indice <= etapa && styles.pasoTextoAlcanzado,
                  ]}
                  numberOfLines={1}
                >
                  {nombre}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tiempo}>
            <Text style={styles.tiempoValor}>
              {terminado ? 0 : minutos} min
            </Text>
            <Text style={styles.tiempoEtiqueta}>Tiempo estimado</Text>
          </View>
        </View>
      </CabeceraFlujoViaje>

      <View style={styles.zonaMapa}>
        <MapaBase
          centro={CENTRO_BAGUA}
          origen={origen}
          destino={destino.coordenadas}
          ruta={ruta}
          conductores={[posicionMoto]}
          margenInferior={0}
          style={styles.mapaCompleto}
        />

        <PanelDeslizableViaje
          posiciones={["30%", "65%", "90%"]}
          posicionInicial={1}
          footer={
            terminado ? (
              <View style={styles.pieFijo}>
                <BotonPrincipal
                  titulo="Calificar viaje"
                  onPress={calificarViaje}
                />
              </View>
            ) : undefined
          }
        >

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contenido}
          >
            {!conectado && (
              <View
                style={[
                  styles.avisoSinConexion,
                  { backgroundColor: colores.errorFondo },
                ]}
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={18}
                  color={colores.error}
                />
                <Text
                  style={[styles.avisoSinConexionTexto, { color: colores.error }]}
                >
                  Sin conexión. Reintentando...
                </Text>
              </View>
            )}

            {terminado && (
              <View
                style={[
                  styles.avisoLlegada,
                  { backgroundColor: colores.exitoFondo },
                ]}
              >
                <Ionicons
                  name="flag"
                  size={20}
                  color={colores.exitoTexto}
                />
                <Text style={[styles.avisoTexto, { color: colores.texto }]}>
                  ¡Llegaste a tu destino!
                </Text>
              </View>
            )}

            {!ubicacionReal && !terminado && (
              <View style={styles.avisoAproximado}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colores.secundario}
                />
                <Text
                  style={[styles.avisoAproximadoTexto, { color: colores.secundario }]}
                >
                  Ubicación aproximada del conductor
                </Text>
              </View>
            )}

            <Text style={[styles.seccion, { color: colores.texto }]}>
              Tu conductor
            </Text>
            <TarjetaConductor conductor={conductor} />

            <View style={styles.acciones}>
              <Pressable
                onPress={() => llamarConductor(conductor?.telefono)}
                style={({ pressed }) => [
                  styles.accion,
                  { backgroundColor: colores.exitoFondo },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="call" size={18} color={colores.exitoTexto} />
                <Text
                  style={[styles.accionTexto, { color: colores.exitoTexto }]}
                >
                  Llamar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => escribirConductor(conductor?.telefono)}
                style={({ pressed }) => [
                  styles.accion,
                  { backgroundColor: colores.exitoFondo },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={18}
                  color={colores.exitoTexto}
                />
                <Text
                  style={[styles.accionTexto, { color: colores.exitoTexto }]}
                >
                  Mensaje
                </Text>
              </Pressable>
              <Pressable
                onPress={compartirViaje}
                style={({ pressed }) => [
                  styles.accion,
                  { backgroundColor: colores.exitoFondo },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name="share-social"
                  size={18}
                  color={colores.exitoTexto}
                />
                <Text
                  style={[styles.accionTexto, { color: colores.exitoTexto }]}
                >
                  Compartir
                </Text>
              </Pressable>
            </View>

            {/* Recorrido */}
            <View
              style={[
                styles.tarjetaRecorrido,
                { backgroundColor: colores.campo },
              ]}
            >
              <View style={styles.filaLugar}>
                <Ionicons
                  name="radio-button-on"
                  size={20}
                  color={colores.exitoTexto}
                />
                <View style={styles.lugarTextos}>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    Origen
                  </Text>
                  <Text
                    style={[styles.lugarNombre, { color: colores.texto }]}
                    numberOfLines={1}
                  >
                    {origenLugar.nombre}
                  </Text>
                </View>
                <Text style={[styles.hora, { color: colores.texto }]}>
                  {formatearHora(horaSalida)}
                </Text>
              </View>

              <View
                style={[styles.separador, { backgroundColor: colores.linea }]}
              />

              <View style={styles.filaLugar}>
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={colores.error}
                />
                <View style={styles.lugarTextos}>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    Destino
                  </Text>
                  <Text
                    style={[styles.lugarNombre, { color: colores.texto }]}
                    numberOfLines={1}
                  >
                    {destino.nombre}
                  </Text>
                </View>
                <View style={styles.llegada}>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    Llegada estimada
                  </Text>
                  <Text style={[styles.hora, { color: colores.texto }]}>
                    {formatearHora(horaLlegada)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tarifa y seguridad */}
            <View
              style={[
                styles.tarifa,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <View style={styles.tarifaMonto}>
                <Ionicons
                  name="ticket-outline"
                  size={24}
                  color={colores.exitoTexto}
                />
                <View>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    Tarifa estimada
                  </Text>
                  <Text style={[styles.tarifaValor, { color: colores.texto }]}>
                    {formatearSoles(tarifa)}
                  </Text>
                </View>
              </View>

              <View style={styles.seguridad}>
                <Ionicons
                  name="shield-checkmark"
                  size={22}
                  color={colores.exitoTexto}
                />
                <View style={styles.seguridadTextos}>
                  <Text
                    style={[
                      styles.seguridadTitulo,
                      { color: colores.texto },
                    ]}
                  >
                    Tu seguridad es primero
                  </Text>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    ¿Necesitas ayuda?
                  </Text>
                </View>
              </View>
            </View>

            {esCancelable && (
              <Pressable
                onPress={solicitarCancelacion}
                disabled={cancelando}
                style={({ pressed }) => [
                  styles.botonCancelar,
                  { borderColor: colores.error },
                  (pressed || cancelando) && { backgroundColor: colores.errorFondo },
                  cancelando && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="close-circle-outline" size={20} color={colores.error} />
                <Text style={[styles.botonCancelarTexto, { color: colores.error }]}>
                  {cancelando ? "Cancelando viaje..." : "Cancelar viaje"}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.reportar,
                { backgroundColor: colores.errorFondo },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="warning-outline" size={20} color={colores.error} />
              <Text style={[styles.reportarTexto, { color: colores.error }]}>
                Reportar un problema
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colores.error}
              />
            </Pressable>
          </BottomSheetScrollView>
        </PanelDeslizableViaje>
      </View>
    </GestureHandlerRootView>
  );
}

const TAMANO_PUNTO = 14;

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  
  zonaMapa: {
    flex: 1,
    position: "relative",
  },

  mapaCompleto: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  pieFijo: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },

  progreso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F0F5F2",
  },

  pasos: {
    flex: 1,
    flexDirection: "row",
  },

  pista: {
    position: "absolute",
    top: TAMANO_PUNTO / 2 - 1,
    left: "12.5%",
    right: "12.5%",
    height: 2,
    backgroundColor: "#C9D8CF",
  },

  pistaRelleno: {
    height: 2,
  },

  paso: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },

  punto: {
    width: TAMANO_PUNTO,
    height: TAMANO_PUNTO,
    borderRadius: TAMANO_PUNTO / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#C9D8CF",
  },

  pasoTexto: {
    fontSize: 10,
    color: "#64776D",
  },

  pasoTextoAlcanzado: {
    fontWeight: "700",
    color: "#286847",
  },

  tiempo: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#E0F3E7",
  },

  tiempoValor: {
    fontSize: 16,
    fontWeight: "800",
    color: "#286847",
  },

  tiempoEtiqueta: {
    fontSize: 9,
    color: "#52675A",
  },

  contenido: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  avisoLlegada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
  },

  avisoTexto: {
    fontSize: 15,
    fontWeight: "700",
  },

  seccion: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
  },

  acciones: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  accion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
  },

  accionTexto: {
    fontSize: 13,
    fontWeight: "700",
  },

  tarjetaRecorrido: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  lugarTextos: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 11,
  },

  lugarNombre: {
    fontSize: 14,
    fontWeight: "700",
  },

  hora: {
    fontSize: 13,
    fontWeight: "700",
  },

  llegada: {
    alignItems: "flex-end",
  },

  separador: {
    height: 1,
    marginVertical: 8,
    marginLeft: 30,
  },

  tarifa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
  },

  tarifaMonto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tarifaValor: {
    fontSize: 20,
    fontWeight: "800",
  },

  seguridad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },

  seguridadTextos: {
    flexShrink: 1,
  },

  seguridadTitulo: {
    fontSize: 12,
    fontWeight: "700",
  },

  reportar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
  },

  reportarTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },

  botonCancelar: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  botonCancelarTexto: {
    fontSize: 16,
    fontWeight: "700",
  },

  avisoAproximado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },

  avisoAproximadoTexto: {
    fontSize: 12,
  },

  avisoSinConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
  },

  avisoSinConexionTexto: {
    fontSize: 13,
    fontWeight: "700",
  },
});
