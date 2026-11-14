import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraFlujoViaje } from "@/features/viajes/components/CabeceraFlujoViaje";
import { PanelDeslizableViaje } from "@/features/viajes/components/PanelDeslizableViaje";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { ContenidoViajeActivo } from "@/features/viajes/components/ContenidoViajeActivo";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import {
  CENTRO_BAGUA,
} from "@/features/viajes/constants/pasajero";
import { useViajeStore } from "@/features/viajes/store/viajeStore";
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

  // Si el conductor cancela el viaje, este regresa a 'buscando' con cancelado_por
  useEffect(() => {
    if (viaje?.estado === "buscando" && viaje.cancelado_por) {
      Alert.alert(
        "Conductor canceló la carrera",
        `El conductor no pudo continuar: "${viaje.motivo_cancelacion || "Problemas en ruta"}". Se ha reabierto la búsqueda de otro mototaxi.`,
        [
          {
            text: "Ver búsqueda",
            onPress: () => router.replace("/buscando-conductor"),
          },
        ]
      );
    }
  }, [viaje?.estado, viaje?.cancelado_por, viaje?.motivo_cancelacion]);

  const calificarViaje = () => {
    // La finalización del viaje la realiza exclusivamente el conductor desde su app.
    // El pasajero navega a la pantalla de calificación una vez concluida la carrera.
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
          <ContenidoViajeActivo
            conectado={conectado}
            terminado={terminado}
            ubicacionReal={Boolean(ubicacionReal)}
            conductor={conductor}
            origenLugar={origenLugar}
            destino={destino}
            horaSalida={horaSalida}
            horaLlegada={horaLlegada}
            tarifa={tarifa}
            esCancelable={esCancelable}
            cancelando={cancelando}
            colores={colores}
            onLlamarConductor={() => llamarConductor(conductor?.telefono)}
            onEscribirConductor={() => escribirConductor(conductor?.telefono)}
            onCompartirViaje={compartirViaje}
            onSolicitarCancelacion={solicitarCancelacion}
            formatearHora={formatearHora}
            formatearSoles={formatearSoles}
          />
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
});
