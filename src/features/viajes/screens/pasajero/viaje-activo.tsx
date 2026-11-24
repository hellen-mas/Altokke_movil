import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { BotonSosEmergencia } from "@/features/viajes/components/BotonSosEmergencia";
import { ModalChatInApp } from "@/features/viajes/components/ModalChatInApp";
import { BotonPrincipal } from "@/shared/components/ui";
import {
  CENTRO_BAGUA,
} from "@/features/viajes/constants/pasajero";
import { useViajeStore } from "@/features/viajes/store/viajeStore";
import { useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useCancelarViaje } from "@/features/viajes/hooks/use-cancelar-viaje";
import { useViajeEnVivo } from "@/features/viajes/hooks/use-viaje-en-vivo";
import { useConductorViaje } from "@/features/viajes/hooks/use-conductor-viaje";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import {
  formatearHora,
  formatearSoles,
  interpolarRuta,
} from "@/features/viajes/utils/viaje";
import { ModalCancelarViaje } from "../../components/ModalCancelarViaje";

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
  const { userId } = useAuth();
  const viajeActivoId = useViajeStore((s) => s.viajeActivoId);
  const verificandoViajeActivo = useViajeStore((s) => s.verificandoViajeActivo);
  const resumen = useResumenViaje();
  const [horaSalida] = useState(() => new Date());
  const [chatVisible, setChatVisible] = useState(false);

  const { viaje, conectado } = useViajeEnVivo(viajeActivoId);
  const conductor = useConductorViaje(
    viajeActivoId,
    viaje?.conductor_id,
    REFRESCO_UBICACION_MS
  );

  const estadoViaje = viaje?.estado ?? "aceptado";
  const etapa = Math.max(0, ESTADOS_PROGRESO.indexOf(estadoViaje));
  const terminado = estadoViaje === "finalizado";

  const {
    solicitarCancelacion,
    cancelando,
    esCancelable,
    modalVisible,
    cerrarModal,
    confirmarCancelación,
  } = useCancelarViaje(estadoViaje);

  // Si el conductor cancela el viaje, este regresa a 'buscando' con cancelado_por.
  // IMPORTANTE: todos los hooks van ANTES del return temprano de abajo. Si este useEffect
  // quedara después, al cancelar (resumen = null) React lanzaría "Rendered fewer hooks".
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

  // Si se está verificando o rehidratando el viaje activo, mostrar skeleton de carga
  if (!resumen) {
    if (verificandoViajeActivo || viajeActivoId) {
      return (
        <View style={[styles.pantalla, styles.centroCarga, { backgroundColor: colores.fondo }]}>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={[styles.textoCargando, { color: colores.secundario }]}>
            Verificando tu viaje activo...
          </Text>
        </View>
      );
    }
    return <Redirect href="/mapa" />;
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

        {/* Botón de Pánico y Auxilio SOS */}
        <View style={styles.contenedorSos}>
          <BotonSosEmergencia
            viajeId={viajeActivoId ?? undefined}
            coordenadasActuales={
              posicionMoto
                ? { lat: posicionMoto.latitude, lng: posicionMoto.longitude }
                : null
            }
          />
        </View>

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
            onLlamarConductor={() => {
              Alert.alert(
                "Comunicación segura",
                "Por tu seguridad y privacidad (Ley 29733), comunícate con tu conductor a través del chat de la app.",
                [
                  { text: "Abrir chat", onPress: () => setChatVisible(true) },
                  { text: "Cancelar", style: "cancel" },
                ]
              );
            }}
            onEscribirConductor={() => setChatVisible(true)}
            onCompartirViaje={compartirViaje}
            onSolicitarCancelacion={solicitarCancelacion}
            formatearHora={formatearHora}
            formatearSoles={formatearSoles}
          />
        </PanelDeslizableViaje>
      </View>

      {/* MODAL DE CHAT IN-APP SEGURO */}
      <ModalChatInApp
        visible={chatVisible}
        onCerrar={() => setChatVisible(false)}
        viajeId={viajeActivoId}
        usuarioActualId={userId}
        rolUsuario="pasajero"
      />

      {/* MODAL DE CANCELACIÓN */}
      <ModalCancelarViaje
        visible={modalVisible}
        rol="pasajero"
        advertenciaLlegada={
          estadoViaje === "esperando_pasajero"
        }
        onConfirmar={confirmarCancelación}
        onCerrar={cerrarModal}
        cargando={cancelando}
      />
      
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

  contenedorSos: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
  },

  centroCarga: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  textoCargando: {
    fontSize: 14,
    fontWeight: "600",
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
