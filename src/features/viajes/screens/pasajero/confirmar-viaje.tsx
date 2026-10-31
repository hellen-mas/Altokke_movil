import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { ReactNode, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraFlujoViaje } from "@/features/viajes/components/CabeceraFlujoViaje";
import { IconoMototaxi } from "@/features/viajes/components/IconoMototaxi";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { BotonPrincipal } from "@/shared/components/ui/BotonPrincipal";
import { MetodoPago, useViaje } from "@/features/viajes/context/ViajeContext";
import { ServicioViaje, useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { viajeService } from "@/features/viajes/services/viajeService";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { formatearSoles } from "@/features/viajes/utils/viaje";
import { ORIGEN_EJEMPLO } from "@/features/viajes/constants/pasajero";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PanelDeslizableViaje } from "@/features/viajes/components/PanelDeslizableViaje";

// Distancia mínima permitida para solicitar un viaje.
const DISTANCIA_MINIMA_KM = 0.1; // 100 metros
const coordenadasValidas = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const SERVICIOS: {
  id: ServicioViaje;
  titulo: string;
  descripcion: string;
  icono: (color: string) => ReactNode;
}[] = [
  {
    id: "normal",
    titulo: "Normal",
    descripcion: "Económico y confiable",
    icono: (color) => <IconoMototaxi size={26} color={color} />,
  },
  {
    id: "express",
    titulo: "Express",
    descripcion: "Llegas más rápido",
    icono: (color) => <Ionicons name="flash" size={24} color={color} />,
  },
];

function Insignia({ letra, color }: { letra: string; color: string }) {
  return (
    <View style={[styles.insignia, { backgroundColor: color }]}>
      <Text style={styles.insigniaTexto}>{letra}</Text>
    </View>
  );
}

const METODOS_PAGO: {
  id: MetodoPago;
  titulo: string;
  detalle: string;
  icono: (color: string) => ReactNode;
}[] = [
  {
    id: "efectivo",
    titulo: "Efectivo",
    detalle: "Pago al finalizar",
    icono: (color) => (
      <Ionicons name="cash-outline" size={22} color={color} />
    ),
  },
  {
    id: "yape",
    titulo: "Yape",
    detalle: "Pago digital",
    icono: () => <Insignia letra="Y" color="#742284" />,
  },
  {
    id: "plin",
    titulo: "Plin",
    detalle: "Pago digital",
    icono: () => <Insignia letra="P" color="#00A8E0" />,
  },
];

export default function PantallaConfirmarViaje() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { 
    tipoServicio, 
    setTipoServicio, 
    metodoPago, 
    setMetodoPago, 
    setOrigen,
    setDestino,
    setViajeActivoId, 
    ubicacionActual 
  } = useViaje();
  const resumen = useResumenViaje();
  const [creandoViaje, setCreandoViaje] = useState(false);
  const solicitudEnProceso = useRef(false);
  
  // Si se entra sin haber elegido destino, se vuelve a pedirlo
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const { origen, origenLugar, destino, servicio, kilometros, tarifa, minutos, ruta } =
    resumen;

  const confirmarViaje = async () => {
    // Evita solicitudes duplicadas
    if (solicitudEnProceso.current) return;

    if (tipoServicio === "reserva") {
      Alert.alert(
        "Servicio no disponible",
        "La programación de viajes todavía no está habilitada. Selecciona Normal o Express."
      );
      return;
    }

    // Verificar que el pasajero tenga una sesión activa
    if (!userId) {
      Alert.alert (
        "Sesión requerida",
        "Debes iniciar sesión para solicitar un mototaxi."
      );
      return;
    }

    if (!resumen) {
      Alert.alert(
        "Destino requerido",
        "Selecciona un destino antes de solicitar el viaje."
      );
      return;
    }

    // No permitir solicitudes con el origen de ejemplo.
    if (origenLugar.id === ORIGEN_EJEMPLO.id) {
      Alert.alert(
        "Selecciona un punto de recojo",
        "No pudimos obtener tu ubicación. Selecciona manualmente un origen real antes de solicitar el viaje."
      );
      return;
    }

    // Verificar coordenadas de ambos lugares.
    if (
      !coordenadasValidas(origen.latitude, origen.longitude) ||
      !coordenadasValidas(
        destino.coordenadas.latitude,
        destino.coordenadas.longitude
      )
    ) {
      Alert.alert(
        "Ubicación no válida",
        "Verifica las ubicaciones de origen y destino e inténtalo nuevamente."
      );
      return;
    }

    // Evitar viajes al mismo punto o demasiado cercanos.
    if (
      !Number.isFinite(kilometros) ||
      kilometros < DISTANCIA_MINIMA_KM
    ) {
      Alert.alert(
        "Origen y destino demasiado cercanos",
        "El origen y el destino deben estar separados por al menos 100 metros. Selecciona un destino diferente."
      );
      return;
    }

    solicitudEnProceso.current = true;
    setCreandoViaje(true);

    try {
      // Comprobar en Supabase si ya existe una solicitud activa.
      const viajeExistente =
        await viajeService.obtenerViajeActivoPasajero(userId);

      if (viajeExistente) {
        // Comprobar que el viaje tenga ubicaciones válidas.
        const {
          origen_lat,
          origen_lng,
          destino_lat,
          destino_lng,
        } = viajeExistente;

        const coordenadasValidas = [
          origen_lat,
          origen_lng,
          destino_lat,
          destino_lng,
        ].every((valor) => typeof valor === "number" && Number.isFinite(valor));

        if (!coordenadasValidas) {
          Alert.alert(
            "No se pudo recuperar el viaje",
            "La solicitud existe, pero sus coordenadas no son válidas."
          );
          return;
        }

        setViajeActivoId(viajeExistente.id);

        Alert.alert(
          "Ya tienes un viaje activo",
          `Tu solicitud se encuentra en estado "${viajeExistente.estado}". ¿Deseas regresar a ella?`,
          [
            {
              text: "Quedarme aquí",
              style: "cancel",
            },
            {
              text: "Ver mi viaje",
              onPress: () => {
                setOrigen({
                  id: `origen-viaje-${viajeExistente.id}`,
                  nombre: viajeExistente.origen_texto,
                  detalle: viajeExistente.origen_texto,
                  coordenadas: {
                    latitude: origen_lat,
                    longitude: origen_lng,
                  },
                });

                setDestino({
                  id: `destino-viaje-${viajeExistente.id}`,
                  nombre: viajeExistente.destino_texto,
                  detalle: viajeExistente.destino_texto,
                  coordenadas: {
                    latitude: destino_lat,
                    longitude: destino_lng,
                  },
                });

                if (
                  viajeExistente.metodo_pago === "efectivo" ||
                  viajeExistente.metodo_pago === "yape" ||
                  viajeExistente.metodo_pago === "plin"
                ) {
                  setMetodoPago(viajeExistente.metodo_pago);
                }

                router.replace("/buscando-conductor");
              },
            },
          ]
        );

        return;
      }
      
      const viajeCreado = await viajeService.crearViaje({
        pasajeroId: userId,
        origenTexto: origenLugar.nombre,
        destinoTexto: destino.nombre,
        origenLat: origen.latitude,
        origenLng: origen.longitude,
        destinoLat: destino.coordenadas.latitude,
        destinoLng: destino.coordenadas.longitude,
        distanciaKm: kilometros,
        tarifaEstimada: tarifa,
        metodoPago,
      });

      if (!viajeCreado?.id) {
        Alert.alert(
          "No se pudo solicitar el viaje",
          "No pudimos registrar tu solicitud en Supabase. Verifica tu conexión a internet e inténtalo nuevamente."
        );
        return;
      }

      setViajeActivoId(viajeCreado.id);

      console.log("ALTOKKE - Viaje registrado:", {
        id: viajeCreado.id,
        estado: viajeCreado.estado,
      });

      router.push("/buscando-conductor");
    } catch (error) {
      console.error("Error al solicitar viaje:", error);

      Alert.alert(
        "Error de conexión",
        "Ocurrió un problema al solicitar tu mototaxi. Inténtalo nuevamente."
      );
    } finally {
      solicitudEnProceso.current = false;
      setCreandoViaje(false);
    }
  };

  return (
    <GestureHandlerRootView style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <CabeceraFlujoViaje
        titulo="Confirmar viaje"
        subtitulo="Revisa los detalles antes de continuar"
      />

      <View style={styles.zonaMapa}>
        <MapaBase
          centro={origen}
          origen={origen}
          ubicacionActual={ubicacionActual}
          destino={destino.coordenadas}
          ruta={ruta}
          margenInferior={0}
          style={styles.mapaCompleto}
        />

        <PanelDeslizableViaje
          posiciones={["35%", "65%", "90%"]}
          posicionInicial={1}
          footer={
            <View style={styles.pieFijo}>
              <BotonPrincipal
                titulo={creandoViaje ? "Solicitando viaje..." : "Confirmar viaje"}
                mostrarIcono
                icono="arrow-forward"
                onPress={confirmarViaje}
                cargando={creandoViaje}
                disabled={creandoViaje}
              />
            </View>
          }
        >
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contenido}
          >
            {/* Origen y destino */}
            <View
              style={[
                styles.tarjeta,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.linea,
                },
              ]}
            >
              <View style={styles.filaLugar}>
                <View
                  style={[
                    styles.iconoLugar,
                    { backgroundColor: colores.exitoFondo },
                  ]}
                >
                  <Ionicons
                    name="radio-button-on"
                    size={20}
                    color={colores.exitoTexto}
                  />
                </View>
                <View style={styles.textoLugar}>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    PUNTO DE RECOJO
                  </Text>
                  <Text style={[styles.lugarNombre, { color: colores.texto }]}>
                    {origenLugar.nombre}
                  </Text>
                </View>
              </View>

              <View
                style={[styles.separador, { backgroundColor: colores.linea }]}
              />

              <View style={styles.filaLugar}>
                <View
                  style={[
                    styles.iconoLugar,
                    styles.iconoDestino,
                    { backgroundColor: colores.errorFondo },
                  ]}
                >
                  <Ionicons
                    name="location-sharp"
                    size={20}
                    color={colores.error}
                  />
                </View>
                <View style={styles.textoLugar}>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    DESTINO
                  </Text>
                  <Text style={[styles.lugarNombre, { color: colores.texto }]}>
                    {destino.nombre}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tipo de servicio */}
            <Text style={[styles.seccion, { color: colores.texto }]}>
              Tipo de servicio
            </Text>
            <View style={styles.opciones}>
              {SERVICIOS.map((opcion) => {
                const seleccionada = opcion.id === servicio;

                return (
                  <Pressable
                    key={opcion.id}
                    onPress={() => setTipoServicio(opcion.id)}
                    style={({ pressed }) => [
                      styles.opcion,
                      {
                        backgroundColor: seleccionada
                          ? colores.exitoFondo
                          : colores.superficie,
                        borderColor: seleccionada
                          ? colores.primario
                          : colores.linea,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {opcion.icono(
                      seleccionada ? colores.exitoTexto : colores.secundario
                    )}
                    <View style={styles.opcionTextos}>
                      <Text
                        style={[
                          styles.opcionTitulo,
                          {
                            color: seleccionada
                              ? colores.exitoTexto
                              : colores.texto,
                          },
                        ]}
                      >
                        {opcion.titulo}
                      </Text>
                      <Text
                        style={[
                          styles.opcionDetalle,
                          { color: colores.secundario },
                        ]}
                        numberOfLines={2}
                      >
                        {opcion.descripcion}
                      </Text>
                    </View>
                    <Ionicons
                      name={seleccionada ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={
                        seleccionada
                          ? colores.exitoTexto
                          : colores.secundario
                      }
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Método de pago */}
            <Text style={[styles.seccion, { color: colores.texto }]}>
              Método de pago
            </Text>
            <View style={styles.opciones}>
              {METODOS_PAGO.map((metodo) => {
                const seleccionado = metodo.id === metodoPago;

                return (
                  <Pressable
                    key={metodo.id}
                    onPress={() => setMetodoPago(metodo.id)}
                    style={({ pressed }) => [
                      styles.metodo,
                      {
                        backgroundColor: seleccionado
                          ? colores.exitoFondo
                          : colores.superficie,
                        borderColor: seleccionado
                          ? colores.primario
                          : colores.linea,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={styles.metodoIcono}>
                      {metodo.icono(
                        seleccionado ? colores.exitoTexto : colores.secundario
                      )}
                    </View>
                    <Text
                      style={[
                        styles.opcionTitulo,
                        {
                          color: seleccionado
                            ? colores.exitoTexto
                            : colores.texto,
                        },
                      ]}
                    >
                      {metodo.titulo}
                    </Text>
                    <Text
                      style={[
                        styles.opcionDetalle,
                        { color: colores.secundario },
                      ]}
                      numberOfLines={1}
                    >
                      {metodo.detalle}
                    </Text>
                    <Ionicons
                      name={
                        seleccionado ? "radio-button-on" : "radio-button-off"
                      }
                      size={16}
                      color={
                        seleccionado
                          ? colores.exitoTexto
                          : colores.secundario
                      }
                      style={styles.metodoRadio}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Tarifa */}
            <View
              style={[
                styles.tarifa,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <View style={styles.tarifaMonto}>
                <View
                  style={[
                    styles.tarifaIcono,
                    { backgroundColor: colores.superficie },
                  ]}
                >
                  <Ionicons
                    name="ticket-outline"
                    size={22}
                    color={colores.exitoTexto}
                  />
                </View>
                <View>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    Tarifa estimada
                  </Text>
                  <Text style={[styles.tarifaValor, { color: colores.texto }]}>
                    {formatearSoles(tarifa)}
                  </Text>
                </View>
              </View>

              <View style={styles.tarifaDetalle}>
                <Text style={[styles.tarifaDato, { color: colores.texto }]}>
                  {kilometros.toFixed(1)} km · {minutos} min
                </Text>
                <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                  Distancia · Tiempo estimado
                </Text>
              </View>
            </View>
          </BottomSheetScrollView>
        </PanelDeslizableViaje>
      </View>
    </GestureHandlerRootView>
  );
}

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

  contenido: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  titulo: {
    fontSize: 22,
    fontWeight: "800",
  },

  subtitulo: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 13,
  },

  tarjeta: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
  },

  iconoLugar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  iconoDestino: {},

  textoLugar: {
    flex: 1,
  },

  separador: {
    height: 1,
    marginVertical: 12,
    marginLeft: 54,
  },

  etiqueta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  lugarNombre: {
    fontSize: 15,
    fontWeight: "700",
  },

  seccion: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "800",
  },

  opciones: {
    flexDirection: "row",
    gap: 10,
  },

  opcion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1.5,
  },

  opcionTextos: {
    flex: 1,
    gap: 4,
  },

  opcionTitulo: {
    fontSize: 14,
    fontWeight: "700",
  },

  opcionDetalle: {
    fontSize: 11,
    lineHeight: 15,
  },

  metodo: {
    flex: 1,
    alignItems: "flex-start",
    gap: 5,
    minHeight: 100,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },

  metodoIcono: {
    height: 30,
    marginBottom: 4,
    justifyContent: "center",
  },

  metodoRadio: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  insignia: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  insigniaTexto: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  tarifa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 22,
    padding: 16,
    borderRadius: 20,
  },

  tarifaMonto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tarifaIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  tarifaValor: {
    fontSize: 26,
    fontWeight: "800",
  },

  tarifaDetalle: {
    alignItems: "flex-end",
  },

  tarifaDato: {
    fontSize: 14,
    fontWeight: "700",
  },

  pie: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
});
