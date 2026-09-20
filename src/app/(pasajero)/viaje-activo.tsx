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
import { CabeceraPasajero } from "@/components/pasajero/CabeceraPasajero";
import { MapaBase } from "@/components/pasajero/MapaBase";
import { TarjetaConductor } from "@/components/pasajero/TarjetaConductor";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  CENTRO_BAGUA,
  COLOR_CABECERA,
  CONDUCTOR_EJEMPLO,
  ORIGEN_EJEMPLO,
} from "@/constants/pasajero";
import { useResumenViaje } from "@/hooks/use-resumen-viaje";
import { paletaColores } from "@/paletaColores";
import {
  formatearHora,
  formatearSoles,
  interpolarRuta,
} from "@/utils/viaje";

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
      message: `Sigue mi viaje en Altokke: voy de ${ORIGEN_EJEMPLO.nombre} a ${destino.nombre} con ${CONDUCTOR_EJEMPLO.nombre}. Llegada estimada: ${formatearHora(horaLlegada)}.`,
    }).catch(() => {});
  };

  const calificarViaje = () => {
    router.replace("/calificacion");
  };

  return (
    <View style={styles.pantalla}>
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
                  { width: `${(etapa / (ETAPAS.length - 1)) * 100}%` },
                ]}
              />
            </View>

            {ETAPAS.map((nombre, indice) => (
              <View key={nombre} style={styles.paso}>
                <View
                  style={[
                    styles.punto,
                    indice <= etapa && styles.puntoAlcanzado,
                    indice === etapa && styles.puntoActual,
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

      <View style={styles.panel}>
        <View style={styles.asa} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          {terminado && (
            <View style={styles.avisoLlegada}>
              <Ionicons
                name="flag"
                size={20}
                color={paletaColores.boton}
              />
              <Text style={styles.avisoTexto}>¡Llegaste a tu destino!</Text>
            </View>
          )}

          <Text style={styles.seccion}>Tu conductor</Text>
          <TarjetaConductor />

          <View style={styles.acciones}>
            <View style={styles.accion}>
              <Ionicons name="call" size={18} color={paletaColores.boton} />
              <Text style={styles.accionTexto}>Llamar</Text>
            </View>
            <View style={styles.accion}>
              <Ionicons
                name="chatbubble-ellipses"
                size={18}
                color={paletaColores.boton}
              />
              <Text style={styles.accionTexto}>Mensaje</Text>
            </View>
            <Pressable
              onPress={compartirViaje}
              style={({ pressed }) => [
                styles.accion,
                pressed && styles.accionPresionada,
              ]}
            >
              <Ionicons
                name="share-social"
                size={18}
                color={paletaColores.boton}
              />
              <Text style={styles.accionTexto}>Compartir</Text>
            </Pressable>
          </View>

          {/* Recorrido */}
          <View style={styles.tarjetaRecorrido}>
            <View style={styles.filaLugar}>
              <Ionicons
                name="radio-button-on"
                size={20}
                color={paletaColores.boton}
              />
              <View style={styles.lugarTextos}>
                <Text style={styles.etiqueta}>Origen</Text>
                <Text style={styles.lugarNombre} numberOfLines={1}>
                  {ORIGEN_EJEMPLO.nombre}
                </Text>
              </View>
              <Text style={styles.hora}>{formatearHora(horaSalida)}</Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.filaLugar}>
              <Ionicons
                name="location-sharp"
                size={20}
                color={paletaColores.error}
              />
              <View style={styles.lugarTextos}>
                <Text style={styles.etiqueta}>Destino</Text>
                <Text style={styles.lugarNombre} numberOfLines={1}>
                  {destino.nombre}
                </Text>
              </View>
              <View style={styles.llegada}>
                <Text style={styles.etiqueta}>Llegada estimada</Text>
                <Text style={styles.hora}>{formatearHora(horaLlegada)}</Text>
              </View>
            </View>
          </View>

          {/* Tarifa y seguridad */}
          <View style={styles.tarifa}>
            <View style={styles.tarifaMonto}>
              <Ionicons
                name="ticket-outline"
                size={24}
                color={paletaColores.boton}
              />
              <View>
                <Text style={styles.etiqueta}>Tarifa estimada</Text>
                <Text style={styles.tarifaValor}>{formatearSoles(tarifa)}</Text>
              </View>
            </View>

            <View style={styles.seguridad}>
              <Ionicons
                name="shield-checkmark"
                size={22}
                color={paletaColores.boton}
              />
              <View style={styles.seguridadTextos}>
                <Text style={styles.seguridadTitulo}>
                  Tu seguridad es primero
                </Text>
                <Text style={styles.etiqueta}>¿Necesitas ayuda?</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.reportar,
              pressed && styles.reportarPresionado,
            ]}
          >
            <Ionicons name="warning-outline" size={20} color={paletaColores.error} />
            <Text style={styles.reportarTexto}>Reportar un problema</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={paletaColores.error}
            />
          </Pressable>
        </ScrollView>

        {terminado && (
          <View
            style={[
              styles.pie,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <PrimaryButton title="Calificar viaje" onPress={calificarViaje} />
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
    backgroundColor: paletaColores.fondoClaro,
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
    backgroundColor: paletaColores.verde,
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

  puntoAlcanzado: {
    backgroundColor: paletaColores.verde,
    borderColor: paletaColores.verde,
  },

  puntoActual: {
    borderColor: paletaColores.texto,
  },

  pasoTexto: {
    fontSize: 10,
    color: paletaColores.textoSecundario,
  },

  pasoTextoAlcanzado: {
    fontWeight: "700",
    color: paletaColores.texto,
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
    color: paletaColores.texto,
  },

  tiempoEtiqueta: {
    fontSize: 9,
    color: paletaColores.textoSecundario,
  },

  panel: {
    flex: 1,
    marginTop: -PANEL_SOBRE_MAPA,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: paletaColores.superficieClara,
    borderTopWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  asa: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
    backgroundColor: paletaColores.bordeClaro,
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
    backgroundColor: "#EAF8F1",
  },

  avisoTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  seccion: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
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
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF8F1",
  },

  accionPresionada: {
    backgroundColor: "#D5F0E3",
  },

  accionTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  tarjetaRecorrido: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F3F6F4",
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
    color: paletaColores.textoSecundarioClaro,
  },

  lugarNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  hora: {
    fontSize: 13,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  llegada: {
    alignItems: "flex-end",
  },

  separador: {
    height: 1,
    marginVertical: 8,
    marginLeft: 30,
    backgroundColor: paletaColores.bordeClaro,
  },

  tarifa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#EAF8F1",
  },

  tarifaMonto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tarifaValor: {
    fontSize: 20,
    fontWeight: "800",
    color: paletaColores.textoClaro,
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
    color: paletaColores.textoClaro,
  },

  reportar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FDECEC",
  },

  reportarPresionado: {
    backgroundColor: "#FAD9D9",
  },

  reportarTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.error,
  },

  pie: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },
});
