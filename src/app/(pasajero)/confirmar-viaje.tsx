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
import { BarraInferior } from "@/components/pasajero/BarraInferior";
import { CabeceraPasajero } from "@/components/pasajero/CabeceraPasajero";
import { IconoMototaxi } from "@/components/pasajero/IconoMototaxi";
import { MapaBase } from "@/components/pasajero/MapaBase";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { CENTRO_BAGUA, ORIGEN_EJEMPLO } from "@/constants/pasajero";
import { MetodoPago, useViaje } from "@/context/ViajeContext";
import { ServicioViaje, useResumenViaje } from "@/hooks/use-resumen-viaje";
import { paletaColores } from "@/paletaColores";
import { formatearSoles } from "@/utils/viaje";

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
  icono: ReactNode;
}[] = [
  {
    id: "efectivo",
    titulo: "Efectivo",
    detalle: "Pago al finalizar",
    icono: (
      <Ionicons name="cash-outline" size={22} color={paletaColores.boton} />
    ),
  },
  {
    id: "yape",
    titulo: "Yape",
    detalle: "Pago digital",
    icono: <Insignia letra="Y" color="#742284" />,
  },
  {
    id: "plin",
    titulo: "Plin",
    detalle: "Pago digital",
    icono: <Insignia letra="P" color="#00A8E0" />,
  },
];

export default function PantallaConfirmarViaje() {
  const { setTipoServicio, metodoPago, setMetodoPago } = useViaje();
  const resumen = useResumenViaje();
  const { height: altoPantalla } = useWindowDimensions();

  // Si se entra sin haber elegido destino, se vuelve a pedirlo
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const { origen, destino, servicio, kilometros, tarifa, minutos, ruta } =
    resumen;

  const confirmarViaje = () => {
    router.push("/buscando-conductor");
  };

  return (
    <View style={styles.pantalla}>
      <CabeceraPasajero />

      <MapaBase
        centro={CENTRO_BAGUA}
        origen={origen}
        destino={destino.coordenadas}
        ruta={ruta}
        margenInferior={PANEL_SOBRE_MAPA + 6}
        style={{ height: Math.round(altoPantalla * PROPORCION_MAPA) }}
      />

      <View style={styles.panel}>
        <View style={styles.asa} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          <Text style={styles.titulo}>Confirma tu viaje</Text>
          <Text style={styles.subtitulo}>
            Revisa los datos antes de solicitar tu mototaxi.
          </Text>

          {/* Origen y destino */}
          <View style={styles.tarjeta}>
            <View style={styles.filaLugar}>
              <View style={styles.iconoLugar}>
                <Ionicons
                  name="radio-button-on"
                  size={20}
                  color={paletaColores.boton}
                />
              </View>
              <View style={styles.textoLugar}>
                <Text style={styles.etiqueta}>Origen</Text>
                <Text style={styles.lugarNombre}>{ORIGEN_EJEMPLO.nombre}</Text>
              </View>
            </View>

            <View style={styles.separador} />

            <View style={styles.filaLugar}>
              <View style={[styles.iconoLugar, styles.iconoDestino]}>
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={paletaColores.error}
                />
              </View>
              <View style={styles.textoLugar}>
                <Text style={styles.etiqueta}>Destino</Text>
                <Text style={styles.lugarNombre}>{destino.nombre}</Text>
              </View>
            </View>
          </View>

          {/* Tipo de servicio */}
          <Text style={styles.seccion}>Tipo de servicio</Text>
          <View style={styles.opciones}>
            {SERVICIOS.map((opcion) => {
              const seleccionada = opcion.id === servicio;

              return (
                <Pressable
                  key={opcion.id}
                  onPress={() => setTipoServicio(opcion.id)}
                  style={[
                    styles.opcion,
                    seleccionada && styles.opcionSeleccionada,
                  ]}
                >
                  {opcion.icono(paletaColores.boton)}
                  <View style={styles.opcionTextos}>
                    <Text style={styles.opcionTitulo}>{opcion.titulo}</Text>
                    <Text style={styles.opcionDetalle} numberOfLines={2}>
                      {opcion.descripcion}
                    </Text>
                  </View>
                  <Ionicons
                    name={seleccionada ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={
                      seleccionada
                        ? paletaColores.boton
                        : paletaColores.deshabilitado
                    }
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Método de pago */}
          <Text style={styles.seccion}>Método de pago</Text>
          <View style={styles.opciones}>
            {METODOS_PAGO.map((metodo) => {
              const seleccionado = metodo.id === metodoPago;

              return (
                <Pressable
                  key={metodo.id}
                  onPress={() => setMetodoPago(metodo.id)}
                  style={[
                    styles.metodo,
                    seleccionado && styles.opcionSeleccionada,
                  ]}
                >
                  <View style={styles.metodoIcono}>{metodo.icono}</View>
                  <Text style={styles.opcionTitulo}>{metodo.titulo}</Text>
                  <Text style={styles.opcionDetalle} numberOfLines={1}>
                    {metodo.detalle}
                  </Text>
                  <Ionicons
                    name={
                      seleccionado ? "radio-button-on" : "radio-button-off"
                    }
                    size={16}
                    color={
                      seleccionado
                        ? paletaColores.boton
                        : paletaColores.deshabilitado
                    }
                    style={styles.metodoRadio}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Tarifa */}
          <View style={styles.tarifa}>
            <View style={styles.tarifaMonto}>
              <View style={styles.tarifaIcono}>
                <Ionicons
                  name="ticket-outline"
                  size={22}
                  color={paletaColores.boton}
                />
              </View>
              <View>
                <Text style={styles.etiqueta}>Tarifa estimada</Text>
                <Text style={styles.tarifaValor}>{formatearSoles(tarifa)}</Text>
              </View>
            </View>

            <View style={styles.tarifaDetalle}>
              <Text style={styles.tarifaDato}>
                {kilometros.toFixed(1)} km · {minutos} min
              </Text>
              <Text style={styles.etiqueta}>Distancia · Tiempo estimado</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.pie}>
          <PrimaryButton title="Confirmar viaje" onPress={confirmarViaje} />
        </View>
      </View>

      <BarraInferior activa="inicio" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
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
    paddingBottom: 8,
  },

  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  subtitulo: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
  },

  tarjeta: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F3F6F4",
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
    backgroundColor: "#E5F8EF",
  },

  iconoDestino: {
    backgroundColor: "#FDECEC",
  },

  textoLugar: {
    flex: 1,
  },

  separador: {
    height: 1,
    marginVertical: 8,
    marginLeft: 44,
    backgroundColor: paletaColores.bordeClaro,
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

  seccion: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
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
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeClaro,
  },

  opcionSeleccionada: {
    backgroundColor: "#EAF8F1",
    borderColor: paletaColores.boton,
  },

  opcionTextos: {
    flex: 1,
  },

  opcionTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  opcionDetalle: {
    fontSize: 10,
    lineHeight: 13,
    color: paletaColores.textoSecundarioClaro,
  },

  metodo: {
    flex: 1,
    alignItems: "flex-start",
    gap: 2,
    padding: 10,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeClaro,
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
    color: paletaColores.texto,
  },

  tarifa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#EAF8F1",
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
    backgroundColor: paletaColores.superficieClara,
  },

  tarifaValor: {
    fontSize: 22,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  tarifaDetalle: {
    alignItems: "flex-end",
  },

  tarifaDato: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  pie: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },
});
