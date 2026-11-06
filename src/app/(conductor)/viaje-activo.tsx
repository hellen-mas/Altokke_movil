import { MapaBase } from "@/components/pasajero/MapaBase";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { PASAJERO_DEMO } from "@/constants/cuenta";
import {
  CENTRO_BAGUA,
  LUGARES_BAGUA,
  ORIGEN_EJEMPLO,
} from "@/constants/pasajero";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DESTINO_EJEMPLO =
  LUGARES_BAGUA.find(
    (lugar) => lugar.id === "plaza-heroes-cenepa"
  ) ?? LUGARES_BAGUA[0];

const TARIFA = 4.94;
const DISTANCIA = "1.3 km";
const TIEMPO = "3 min";

export default function ViajeActivoConductor() {
  const mostrarRuta = () => {
    Alert.alert(
      "Ruta del viaje",
      "Más adelante esta opción abrirá la navegación GPS hasta el destino."
    );
  };

  const llamarPasajero = () => {
    Alert.alert(
      "Llamar al pasajero",
      `Se realizaría una llamada a ${PASAJERO_DEMO.nombre}.`
    );
  };

  const abrirChat = () => {
    Alert.alert(
      "Chat",
      "El chat con el pasajero estará disponible en una siguiente versión."
    );
  };

  const finalizarViaje = () => {
    Alert.alert(
      "Finalizar viaje",
      "¿Confirmas que llegaste al destino?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Finalizar",
          onPress: () => {
            router.replace("/cuenta/historial");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.pantalla}>
      {/* CABECERA */}
      <CabeceraConductor
        titulo="Viaje activo"
        subtitulo="Llevando al pasajero a su destino"
        mostrarMarca
        mostrarAtras={false}
        compacta
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ESTADO DEL VIAJE */}
        <View style={styles.estadoRuta}>
          <View style={styles.estadoIcono}>
            <Ionicons
              name="navigate"
              size={20}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.estadoInformacion}>
            <Text style={styles.estadoTitulo}>
              En ruta al destino
            </Text>

            <Text style={styles.estadoDescripcion}>
              Llegas en aproximadamente {TIEMPO}
            </Text>
          </View>

          <View style={styles.tiempoBadge}>
            <Ionicons
              name="time-outline"
              size={15}
              color={paletaColores.verde}
            />

            <Text style={styles.tiempoTexto}>
              {TIEMPO}
            </Text>
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
        <Text style={styles.seccionTitulo}>
          Detalles del viaje
        </Text>

        <View style={styles.detalles}>
          {/* PASAJERO */}
          <View style={styles.pasajeroFila}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>
                {PASAJERO_DEMO.iniciales}
              </Text>
            </View>

            <View style={styles.pasajeroInformacion}>
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
                  {PASAJERO_DEMO.calificacion} ·{" "}
                  {PASAJERO_DEMO.viajes} viajes
                </Text>
              </View>
            </View>

            {/* CONTACTO */}
            <View style={styles.accionesPasajero}>
              <Pressable
                style={styles.accionCircular}
                onPress={llamarPasajero}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={paletaColores.verde}
                />
              </Pressable>

              <Pressable
                style={styles.accionCircular}
                onPress={abrirChat}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={paletaColores.verde}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.divisor} />

          {/* RECOGIDA */}
          <View style={styles.ubicacionFila}>
            <View style={styles.iconoVerde}>
              <Ionicons
                name="radio-button-on"
                size={18}
                color={paletaColores.verde}
              />
            </View>

            <View style={styles.ubicacionTexto}>
              <Text style={styles.etiqueta}>
                Recogida
              </Text>

              <Text style={styles.valorUbicacion}>
                {ORIGEN_EJEMPLO.nombre}
              </Text>
            </View>
          </View>

          {/* DESTINO */}
          <View style={styles.ubicacionFila}>
            <View style={styles.iconoRojo}>
              <Ionicons
                name="location"
                size={18}
                color={paletaColores.error}
              />
            </View>

            <View style={styles.ubicacionTexto}>
              <Text style={styles.etiqueta}>
                Destino
              </Text>

              <Text style={styles.valorUbicacion}>
                {DESTINO_EJEMPLO.nombre}
              </Text>
            </View>
          </View>

          <View style={styles.divisor} />

          {/* RESUMEN */}
          <View style={styles.resumenViaje}>
            <View style={styles.resumenItem}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={paletaColores.verde}
              />

              <Text style={styles.resumenEtiqueta}>
                Tarifa
              </Text>

              <Text style={styles.resumenValor}>
                S/ {TARIFA.toFixed(2)}
              </Text>

              <Text style={styles.resumenDetalle}>
                Pago en efectivo
              </Text>
            </View>

            <View style={styles.separadorVertical} />

            <View style={styles.resumenItem}>
              <Ionicons
                name="navigate-outline"
                size={20}
                color={paletaColores.verde}
              />

              <Text style={styles.resumenEtiqueta}>
                Distancia
              </Text>

              <Text style={styles.resumenValor}>
                {DISTANCIA}
              </Text>

              <Text style={styles.resumenDetalle}>
                Restante
              </Text>
            </View>

            <View style={styles.separadorVertical} />

            <View style={styles.resumenItem}>
              <Ionicons
                name="time-outline"
                size={20}
                color={paletaColores.verde}
              />

              <Text style={styles.resumenEtiqueta}>
                Tiempo
              </Text>

              <Text style={styles.resumenValor}>
                {TIEMPO}
              </Text>

              <Text style={styles.resumenDetalle}>
                Estimado
              </Text>
            </View>
          </View>
        </View>

        {/* BOTONES */}
        <View style={styles.botones}>
          <Pressable
            style={styles.botonRuta}
            onPress={mostrarRuta}
          >
            <Ionicons
              name="navigate"
              size={18}
              color={paletaColores.textoClaro}
            />

            <Text style={styles.botonRutaTexto}>
              Ver ruta
            </Text>
          </Pressable>

          <Pressable
            style={styles.botonFinalizar}
            onPress={finalizarViaje}
          >
            <Ionicons
              name="flag"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.botonFinalizarTexto}>
              Finalizar viaje
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },

  /* Estado */

  estadoRuta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#075B3A",
    marginBottom: 14,
  },

  estadoIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginRight: 11,
  },

  estadoInformacion: {
    flex: 1,
  },

  estadoTitulo: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  estadoDescripcion: {
    marginTop: 2,
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
  },

  tiempoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },

  tiempoTexto: {
    color: paletaColores.verde,
    fontSize: 12,
    fontWeight: "800",
  },

  /* Mapa */

  mapaContainer: {
    height: 270,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    marginBottom: 20,
  },

  mapa: {
    width: "100%",
    height: "100%",
  },

  /* Sección */

  seccionTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 12,
  },

  detalles: {
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 14,
    padding: 16,
  },

  /* Pasajero */

  pasajeroFila: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F7F0",
    marginRight: 11,
  },

  avatarTexto: {
    color: paletaColores.verde,
    fontSize: 14,
    fontWeight: "800",
  },

  pasajeroInformacion: {
    flex: 1,
  },

  pasajeroNombre: {
    color: paletaColores.textoClaro,
    fontSize: 16,
    fontWeight: "800",
  },

  calificacionFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },

  calificacionTexto: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
  },

  accionesPasajero: {
    flexDirection: "row",
    gap: 7,
  },

  accionCircular: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
  },

  divisor: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: paletaColores.bordeClaro,
    marginVertical: 15,
  },

  /* Ubicaciones */

  ubicacionFila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  iconoVerde: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F1",
    marginRight: 11,
  },

  iconoRojo: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBEAEA",
    marginRight: 11,
  },

  ubicacionTexto: {
    flex: 1,
  },

  etiqueta: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 11,
  },

  valorUbicacion: {
    color: paletaColores.textoClaro,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },

  /* Datos */

  resumenViaje: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  resumenItem: {
    flex: 1,
  },

  resumenEtiqueta: {
    marginTop: 5,
    fontSize: 10,
    color: paletaColores.textoSecundarioClaro,
  },

  resumenValor: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  resumenDetalle: {
    marginTop: 2,
    fontSize: 9,
    color: paletaColores.textoSecundarioClaro,
  },

  separadorVertical: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 10,
    backgroundColor: paletaColores.bordeClaro,
  },

  /* Botones */

  botones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  botonRuta: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  botonRutaTexto: {
    color: paletaColores.textoClaro,
    fontSize: 14,
    fontWeight: "700",
  },

  botonFinalizar: {
    flex: 1.35,
    height: 52,
    borderRadius: 12,
    backgroundColor: paletaColores.verde,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  botonFinalizarTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
