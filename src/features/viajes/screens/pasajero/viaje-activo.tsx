import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CabeceraPasajero } from "@/features/pasajeros/components/CabeceraPasajero";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { TarjetaConductor } from "@/features/viajes/components/TarjetaConductor";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import {
  CENTRO_BAGUA,
  COLOR_CABECERA,
  ORIGEN_INICIAL_BAGUA,
} from "@/features/viajes/constants/pasajero";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { viajeService } from "@/features/viajes/services/viajeService";
import { useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  formatearHora,
  formatearSoles,
  interpolarRuta,
} from "@/features/viajes/utils/viaje";

const PANEL_SOBRE_MAPA = 20;
const PROPORCION_MAPA = 0.3;

// TEMPORAL: el recorrido se simula en unos segundos (más adelante vendrá de la
// ubicación real del conductor)
const DURACION_SIMULADA_MS = 24000;
const PASO_SIMULACION_MS = 400;
const AVANCE_LLEGANDO = 0.8;

const ETAPAS = ["Recogido", "En camino", "Llegando", "Finaliza"];
const ETAPA_EN_CAMINO = 1;
const ETAPA_LLEGANDO = 2;
const ETAPA_FINALIZADO = 3;

const SUBTITULOS_ETAPA = [
  "",
  "En camino a tu destino",
  "Llegando a tu destino",
  "Llegaste a tu destino",
];

export default function PantallaViajeActivo() {
  const { colores } = useAltokkeTheme();
  const { viajeActivoId } = useViaje();
  const resumen = useResumenViaje();
  const insets = useSafeAreaInsets();
  const { height: altoPantalla } = useWindowDimensions();
  const [avance, setAvance] = useState(0);
  const [horaSalida] = useState(() => new Date());

  const terminado = avance >= 1;

  useEffect(() => {
    if (terminado) return;

    const reloj = setInterval(() => {
      setAvance((actual) =>
        Math.min(1, actual + PASO_SIMULACION_MS / DURACION_SIMULADA_MS),
      );
    }, PASO_SIMULACION_MS);

    return () => clearInterval(reloj);
  }, [terminado]);

  // Si se entra sin haber armado un viaje, se vuelve a pedir el destino
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const { origen, destino, tarifa, minutos, ruta } = resumen;

  const etapa = terminado
    ? ETAPA_FINALIZADO
    : avance >= AVANCE_LLEGANDO
      ? ETAPA_LLEGANDO
      : ETAPA_EN_CAMINO;
  const minutosRestantes = Math.ceil(minutos * (1 - avance));
  const horaLlegada = new Date(horaSalida.getTime() + minutos * 60000);

  const compartirViaje = () => {
    Share.share({
      message: `Sigue mi viaje en Altokke: voy de ${ORIGEN_INICIAL_BAGUA.nombre} a ${destino.nombre}. Llegada estimada: ${formatearHora(horaLlegada)}.`,
    }).catch(() => {});
  };

  const calificarViaje = () => {
    if (viajeActivoId) {
      viajeService.finalizarViaje(viajeActivoId, tarifa).catch(() => {});
    }
    router.replace("/calificacion");
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <CabeceraPasajero
        titulo={terminado ? "Viaje finalizado" : "Viaje en curso"}
        subtitulo={SUBTITULOS_ETAPA[etapa]}
        paddingInferior={16}
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
                      borderColor: "#FFFFFF",
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
              {terminado ? 0 : minutosRestantes} min
            </Text>
            <Text style={styles.tiempoEtiqueta}>Tiempo estimado</Text>
          </View>
        </View>
      </CabeceraPasajero>

      <MapaBase
        centro={CENTRO_BAGUA}
        origen={origen}
        destino={destino.coordenadas}
        ruta={ruta}
        conductores={[interpolarRuta(ruta, avance)]}
        margenInferior={PANEL_SOBRE_MAPA + 6}
        style={{ height: Math.round(altoPantalla * PROPORCION_MAPA) }}
      />

      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        <View style={[styles.asa, { backgroundColor: colores.linea }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
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

          <Text style={[styles.seccion, { color: colores.texto }]}>
            Tu conductor
          </Text>
          <TarjetaConductor />

          <View style={styles.acciones}>
            <View
              style={[
                styles.accion,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <Ionicons name="call" size={18} color={colores.exitoTexto} />
              <Text
                style={[styles.accionTexto, { color: colores.exitoTexto }]}
              >
                Llamar
              </Text>
            </View>
            <View
              style={[
                styles.accion,
                { backgroundColor: colores.exitoFondo },
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
            </View>
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
                  {ORIGEN_INICIAL_BAGUA.nombre}
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
        </ScrollView>

        {terminado && (
          <View
            style={[
              styles.pie,
              {
                borderTopColor: colores.linea,
                backgroundColor: colores.superficie,
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
          >
            <BotonPrincipal titulo="Calificar viaje" onPress={calificarViaje} />
          </View>
        )}
      </View>
    </View>
  );
}

const TAMANO_PUNTO = 14;

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  progreso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    backgroundColor: COLOR_CABECERA,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  pasoTexto: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },

  pasoTextoAlcanzado: {
    fontWeight: "700",
    color: "#FFFFFF",
  },

  tiempo: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(57, 200, 135, 0.2)",
  },

  tiempoValor: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  tiempoEtiqueta: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.8)",
  },

  panel: {
    flex: 1,
    marginTop: -PANEL_SOBRE_MAPA,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
  },

  asa: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },

  contenido: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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

  pie: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
