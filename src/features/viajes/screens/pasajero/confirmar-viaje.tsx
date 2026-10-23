import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BarraInferior } from "@/features/pasajeros/components/BarraInferior";
import { CabeceraPasajero } from "@/features/pasajeros/components/CabeceraPasajero";
import { IconoMototaxi } from "@/features/viajes/components/IconoMototaxi";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { CENTRO_BAGUA, ORIGEN_EJEMPLO } from "@/features/viajes/constants/pasajero";
import { MetodoPago, useViaje } from "@/features/viajes/context/ViajeContext";
import { ServicioViaje, useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { viajeService } from "@/features/viajes/services/viajeService";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { formatearSoles } from "@/features/viajes/utils/viaje";

const PANEL_SOBRE_MAPA = 20;
const PROPORCION_MAPA = 0.3;

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
  const { setTipoServicio, metodoPago, setMetodoPago, setViajeActivoId } = useViaje();
  const resumen = useResumenViaje();
  const { height: altoPantalla } = useWindowDimensions();

  // Si se entra sin haber elegido destino, se vuelve a pedirlo
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const { origen, destino, servicio, kilometros, tarifa, minutos, ruta } =
    resumen;

  const confirmarViaje = async () => {
    if (userId) {
      try {
        const viajeCreado = await viajeService.crearViaje({
          pasajeroId: userId,
          origenTexto: ORIGEN_EJEMPLO.nombre,
          destinoTexto: destino.nombre,
          origenLat: origen.latitude,
          origenLng: origen.longitude,
          destinoLat: destino.coordenadas.latitude,
          destinoLng: destino.coordenadas.longitude,
          distanciaKm: kilometros,
          tarifaEstimada: tarifa,
          metodoPago,
        });

        if (viajeCreado?.id) {
          setViajeActivoId(viajeCreado.id);
        }
      } catch (err) {
        console.warn("Aviso al crear viaje en Supabase:", err);
      }
    }
    router.push("/buscando-conductor");
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <CabeceraPasajero />

      <MapaBase
        centro={CENTRO_BAGUA}
        origen={origen}
        destino={destino.coordenadas}
        ruta={ruta}
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
          <Text style={[styles.titulo, { color: colores.texto }]}>
            Confirma tu viaje
          </Text>
          <Text style={[styles.subtitulo, { color: colores.secundario }]}>
            Revisa los datos antes de solicitar tu mototaxi.
          </Text>

          {/* Origen y destino */}
          <View style={[styles.tarjeta, { backgroundColor: colores.campo }]}>
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
                  Origen
                </Text>
                <Text style={[styles.lugarNombre, { color: colores.texto }]}>
                  {ORIGEN_EJEMPLO.nombre}
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
                  Destino
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
                  style={[
                    styles.opcion,
                    {
                      backgroundColor: seleccionada
                        ? colores.exitoFondo
                        : colores.superficie,
                      borderColor: seleccionada
                        ? colores.primario
                        : colores.linea,
                    },
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
                        ? colores.primario
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
                  style={[
                    styles.metodo,
                    {
                      backgroundColor: seleccionado
                        ? colores.exitoFondo
                        : colores.superficie,
                      borderColor: seleccionado
                        ? colores.primario
                        : colores.linea,
                    },
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
                        ? colores.primario
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
        </ScrollView>

        <View
          style={[
            styles.pie,
            {
              borderTopColor: colores.linea,
              backgroundColor: colores.superficie,
            },
          ]}
        >
          <BotonPrincipal titulo="Confirmar viaje" onPress={confirmarViaje} />
        </View>
      </View>

      <BarraInferior activa="inicio" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
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
    paddingBottom: 8,
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
    padding: 12,
    borderRadius: 14,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconoLugar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  iconoDestino: {},

  textoLugar: {
    flex: 1,
  },

  separador: {
    height: 1,
    marginVertical: 8,
    marginLeft: 44,
  },

  etiqueta: {
    fontSize: 11,
  },

  lugarNombre: {
    fontSize: 14,
    fontWeight: "700",
  },

  seccion: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
  },

  opciones: {
    flexDirection: "row",
    gap: 8,
  },

  opcion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },

  opcionTextos: {
    flex: 1,
  },

  opcionTitulo: {
    fontSize: 13,
    fontWeight: "700",
  },

  opcionDetalle: {
    fontSize: 10,
    lineHeight: 13,
  },

  metodo: {
    flex: 1,
    alignItems: "flex-start",
    gap: 2,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },

  metodoIcono: {
    height: 28,
    marginBottom: 2,
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
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
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
    fontSize: 22,
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
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
});
