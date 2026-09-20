import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CabeceraPasajero } from "@/components/pasajero/CabeceraPasajero";
import { IconoMototaxi } from "@/components/pasajero/IconoMototaxi";
import { MapaBase } from "@/components/pasajero/MapaBase";
import { PulsoBusqueda } from "@/components/pasajero/PulsoBusqueda";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  CENTRO_BAGUA,
  CONDUCTOR_EJEMPLO,
  CONDUCTORES_CERCANOS,
  ORIGEN_EJEMPLO,
} from "@/constants/pasajero";
import { MetodoPago, useViaje } from "@/context/ViajeContext";
import { useResumenViaje } from "@/hooks/use-resumen-viaje";
import { paletaColores } from "@/paletaColores";
import { formatearSoles } from "@/utils/viaje";

const PANEL_SOBRE_MAPA = 20;
const PROPORCION_MAPA = 0.3;

// TEMPORAL: mientras no haya backend, el conductor "aparece" después de unos segundos
const TIEMPO_BUSQUEDA_MS = 5000;

const NOMBRE_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
};

export default function PantallaBuscandoConductor() {
  const { setDestino } = useViaje();
  const resumen = useResumenViaje();
  const insets = useSafeAreaInsets();
  const { height: altoPantalla } = useWindowDimensions();
  const [conductorEncontrado, setConductorEncontrado] = useState(false);

  useEffect(() => {
    const espera = setTimeout(
      () => setConductorEncontrado(true),
      TIEMPO_BUSQUEDA_MS,
    );

    return () => clearTimeout(espera);
  }, []);

  // Si se entra sin haber armado un viaje, se vuelve a pedir el destino
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const { origen, destino, servicio, metodoPago, tarifa, minutos, ruta } =
    resumen;

  const cancelarViaje = () => {
    setDestino(null);
    router.replace("/mapa");
  };

  const verMiViaje = () => {
    // router.push("/viaje-activo");
  };

  return (
    <View style={styles.pantalla}>
      <CabeceraPasajero
        titulo={conductorEncontrado ? "Conductor encontrado" : "Buscando conductor"}
        subtitulo={
          conductorEncontrado
            ? `Llega en aproximadamente ${minutos} min`
            : "Estamos buscando un mototaxi cerca de ti"
        }
        paddingInferior={12}
      />

      <MapaBase
        centro={CENTRO_BAGUA}
        origen={origen}
        destino={destino.coordenadas}
        ruta={ruta}
        conductores={
          conductorEncontrado ? [CONDUCTORES_CERCANOS[0]] : CONDUCTORES_CERCANOS
        }
        margenInferior={PANEL_SOBRE_MAPA + 6}
        style={{ height: Math.round(altoPantalla * PROPORCION_MAPA) }}
      />

      <View style={styles.panel}>
        <View style={styles.asa} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          {conductorEncontrado ? (
            <>
              <View style={styles.avisoEncontrado}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={paletaColores.boton}
                />
                <Text style={styles.avisoTexto}>
                  ¡Tu mototaxi va en camino!
                </Text>
              </View>

              {/* Conductor */}
              <Text style={styles.seccion}>Tu conductor</Text>
              <View style={styles.tarjeta}>
                <View style={styles.avatar}>
                  <Ionicons
                    name="person"
                    size={26}
                    color={paletaColores.textoSecundarioClaro}
                  />
                </View>

                <View style={styles.conductorTextos}>
                  <View style={styles.filaNombre}>
                    <Text style={styles.conductorNombre} numberOfLines={1}>
                      {CONDUCTOR_EJEMPLO.nombre}
                    </Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={paletaColores.boton}
                    />
                  </View>
                  <View style={styles.filaNombre}>
                    <Ionicons name="star" size={14} color="#F5B301" />
                    <Text style={styles.conductorDetalle}>
                      {CONDUCTOR_EJEMPLO.calificacion} ·{" "}
                      {CONDUCTOR_EJEMPLO.viajes} viajes
                    </Text>
                  </View>
                </View>

                <View style={styles.vehiculo}>
                  <IconoMototaxi size={30} color={paletaColores.boton} />
                  <Text style={styles.vehiculoTitulo}>
                    {CONDUCTOR_EJEMPLO.vehiculo}
                  </Text>
                  <Text style={styles.vehiculoPlaca}>
                    {CONDUCTOR_EJEMPLO.placa}
                  </Text>
                  <Text style={styles.vehiculoColor} numberOfLines={1}>
                    {CONDUCTOR_EJEMPLO.color}
                  </Text>
                </View>
              </View>

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
              </View>
            </>
          ) : (
            <View style={styles.buscando}>
              <PulsoBusqueda />
              <Text style={styles.buscandoTitulo}>
                Buscando el mototaxi más cercano
              </Text>
              <Text style={styles.buscandoDetalle}>
                Esto puede tardar unos segundos. No cierres la aplicación.
              </Text>
            </View>
          )}

          {/* Resumen del viaje */}
          <Text style={styles.seccion}>Resumen del viaje</Text>
          <View style={styles.tarjetaResumen}>
            <View style={styles.filaLugar}>
              <Ionicons
                name="radio-button-on"
                size={18}
                color={paletaColores.boton}
              />
              <Text style={styles.lugarTexto} numberOfLines={1}>
                {ORIGEN_EJEMPLO.nombre}
              </Text>
            </View>

            <View style={styles.filaLugar}>
              <Ionicons
                name="location-sharp"
                size={18}
                color={paletaColores.error}
              />
              <Text style={styles.lugarTexto} numberOfLines={1}>
                {destino.nombre}
              </Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.datos}>
              <View style={styles.dato}>
                <Text style={styles.datoEtiqueta}>Servicio</Text>
                <Text style={styles.datoValor}>
                  {servicio === "express" ? "Express" : "Normal"}
                </Text>
              </View>
              <View style={styles.dato}>
                <Text style={styles.datoEtiqueta}>Pago</Text>
                <Text style={styles.datoValor}>
                  {NOMBRE_METODO_PAGO[metodoPago]}
                </Text>
              </View>
              <View style={styles.dato}>
                <Text style={styles.datoEtiqueta}>Tarifa</Text>
                <Text style={styles.datoValor}>{formatearSoles(tarifa)}</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={cancelarViaje}
            style={({ pressed }) => [
              styles.botonCancelar,
              pressed && styles.botonCancelarPresionado,
            ]}
          >
            <Text style={styles.botonCancelarTexto}>Cancelar viaje</Text>
          </Pressable>
        </ScrollView>

        {conductorEncontrado && (
          <View
            style={[
              styles.pie,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <PrimaryButton title="Ver mi viaje" onPress={verMiViaje} />
          </View>
        )}
      </View>
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

  buscando: {
    alignItems: "center",
    paddingTop: 4,
  },

  buscandoTitulo: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    color: paletaColores.textoClaro,
  },

  buscandoDetalle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    color: paletaColores.textoSecundarioClaro,
  },

  avisoEncontrado: {
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
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F3F6F4",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  conductorTextos: {
    flex: 1,
    gap: 3,
  },

  filaNombre: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  conductorNombre: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  conductorDetalle: {
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  vehiculo: {
    alignItems: "center",
    maxWidth: 110,
  },

  vehiculoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  vehiculoPlaca: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
    fontSize: 10,
    overflow: "hidden",
    color: paletaColores.textoSecundarioClaro,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  vehiculoColor: {
    marginTop: 2,
    fontSize: 10,
    color: paletaColores.textoSecundarioClaro,
  },

  acciones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  accion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF8F1",
  },

  accionTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  tarjetaResumen: {
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F3F6F4",
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  lugarTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  separador: {
    height: 1,
    backgroundColor: paletaColores.bordeClaro,
  },

  datos: {
    flexDirection: "row",
  },

  dato: {
    flex: 1,
  },

  datoEtiqueta: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  datoValor: {
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  pie: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },

  botonCancelar: {
    height: 48,
    marginTop: 16,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: paletaColores.error,
  },

  botonCancelarPresionado: {
    backgroundColor: "#FDECEC",
  },

  botonCancelarTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: paletaColores.error,
  },
});
