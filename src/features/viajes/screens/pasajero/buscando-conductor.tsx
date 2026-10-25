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
import { CabeceraPasajero } from "@/features/pasajeros/components/CabeceraPasajero";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { PulsoBusqueda } from "@/features/viajes/components/PulsoBusqueda";
import { TarjetaConductor } from "@/features/viajes/components/TarjetaConductor";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import {
  CENTRO_BAGUA,
  CONDUCTORES_CERCANOS,
  ORIGEN_EJEMPLO,
} from "@/features/viajes/constants/pasajero";
import { useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useCancelarViaje } from "@/features/viajes/hooks/use-cancelar-viaje";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useViajeEnVivo } from "@/features/viajes/hooks/use-viaje-en-vivo";
import { useConductorViaje } from "@/features/viajes/hooks/use-conductor-viaje";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { formatearSoles, NOMBRE_METODO_PAGO } from "@/features/viajes/utils/viaje";
import { escribirConductor, llamarConductor } from "@/features/viajes/utils/contacto";

const PANEL_SOBRE_MAPA = 20;
const PROPORCION_MAPA = 0.3;

// Si nadie acepta en este tiempo, se avisa que no hay conductores disponibles
const TIEMPO_MAXIMO_BUSQUEDA = 2 * 60 * 1000;

export default function PantallaBuscandoConductor() {
  const { colores } = useAltokkeTheme();
  const resumen = useResumenViaje();
  const insets = useSafeAreaInsets();
  const { height: altoPantalla } = useWindowDimensions();
  const { solicitarCancelacion, cancelando } = useCancelarViaje("buscando");

  const { viajeActivoId } = useViaje();
  const { viaje } = useViajeEnVivo(viajeActivoId);
  const conductorEncontrado = Boolean(viaje?.conductor_id);
  const conductor = useConductorViaje(viajeActivoId, viaje?.conductor_id);

  const [sinConductor, setSinConductor] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (conductorEncontrado) return;
    const espera = setTimeout(() => setSinConductor(true), TIEMPO_MAXIMO_BUSQUEDA);
    return () => clearTimeout(espera);
  }, [conductorEncontrado, intento]);

  const mostrarSinConductor = sinConductor && !conductorEncontrado;

  // Si se entra sin haber armado un viaje, se vuelve a pedir el destino
  if (!resumen) {
    return <Redirect href="/destino" />;
  }

  const { origen, destino, servicio, metodoPago, tarifa, minutos, ruta } =
    resumen;

  const verMiViaje = () => {
    router.replace("/viaje-activo");
  };

  const seguirBuscando = () => {
    setSinConductor(false);
    setIntento((n) => n + 1);
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
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
          {conductorEncontrado ? (
            <>
              <View
                style={[
                  styles.avisoEncontrado,
                  { backgroundColor: colores.exitoFondo },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colores.exitoTexto}
                />
                <Text style={[styles.avisoTexto, { color: colores.texto }]}>
                  ¡Tu mototaxi va en camino!
                </Text>
              </View>

              {/* Conductor */}
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
              </View>
            </>
          ) : mostrarSinConductor ? (
            <View style={styles.buscando}>
              <Ionicons name="alert-circle" size={44} color={colores.error} />
              <Text style={[styles.buscandoTitulo, { color: colores.texto }]}>
                No hay mototaxis disponibles
              </Text>
              <Text
                style={[
                  styles.buscandoDetalle,
                  { color: colores.secundario },
                ]}
              >
                Nadie aceptó tu viaje todavía. Puedes seguir esperando o cancelar.
              </Text>
              <View style={styles.botonSeguir}>
                <BotonPrincipal titulo="Seguir buscando" onPress={seguirBuscando} />
              </View>
            </View>
          ) : (
            <View style={styles.buscando}>
              <PulsoBusqueda />
              <Text style={[styles.buscandoTitulo, { color: colores.texto }]}>
                Buscando el mototaxi más cercano
              </Text>
              <Text
                style={[
                  styles.buscandoDetalle,
                  { color: colores.secundario },
                ]}
              >
                Esto puede tardar unos segundos. No cierres la aplicación.
              </Text>
            </View>
          )}

          {/* Resumen del viaje */}
          <Text style={[styles.seccion, { color: colores.texto }]}>
            Resumen del viaje
          </Text>
          <View
            style={[
              styles.tarjetaResumen,
              { backgroundColor: colores.campo },
            ]}
          >
            <View style={styles.filaLugar}>
              <Ionicons
                name="radio-button-on"
                size={18}
                color={colores.exitoTexto}
              />
              <Text
                style={[styles.lugarTexto, { color: colores.texto }]}
                numberOfLines={1}
              >
                {ORIGEN_EJEMPLO.nombre}
              </Text>
            </View>

            <View style={styles.filaLugar}>
              <Ionicons
                name="location-sharp"
                size={18}
                color={colores.error}
              />
              <Text
                style={[styles.lugarTexto, { color: colores.texto }]}
                numberOfLines={1}
              >
                {destino.nombre}
              </Text>
            </View>

            <View
              style={[styles.separador, { backgroundColor: colores.linea }]}
            />

            <View style={styles.datos}>
              <View style={styles.dato}>
                <Text
                  style={[styles.datoEtiqueta, { color: colores.secundario }]}
                >
                  Servicio
                </Text>
                <Text
                  style={[styles.datoValor, { color: colores.texto }]}
                >
                  {servicio === "express" ? "Express" : "Normal"}
                </Text>
              </View>
              <View style={styles.dato}>
                <Text
                  style={[styles.datoEtiqueta, { color: colores.secundario }]}
                >
                  Pago
                </Text>
                <Text
                  style={[styles.datoValor, { color: colores.texto }]}
                >
                  {NOMBRE_METODO_PAGO[metodoPago]}
                </Text>
              </View>
              <View style={styles.dato}>
                <Text
                  style={[styles.datoEtiqueta, { color: colores.secundario }]}
                >
                  Tarifa
                </Text>
                <Text
                  style={[styles.datoValor, { color: colores.texto }]}
                >
                  {formatearSoles(tarifa)}
                </Text>
              </View>
            </View>
          </View>

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
            <Text style={[styles.botonCancelarTexto, { color: colores.error }]}>
              {cancelando ? "Cancelando..." : "Cancelar viaje"}
            </Text>
          </Pressable>
        </ScrollView>

        {conductorEncontrado && (
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
            <BotonPrincipal titulo="Ver mi viaje" onPress={verMiViaje} />
          </View>
        )}
      </View>
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

  buscando: {
    alignItems: "center",
    paddingTop: 4,
  },

  buscandoTitulo: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  buscandoDetalle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  avisoEncontrado: {
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
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
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
    height: 44,
    borderRadius: 12,
  },

  accionTexto: {
    fontSize: 14,
    fontWeight: "700",
  },

  tarjetaResumen: {
    gap: 8,
    padding: 12,
    borderRadius: 14,
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
  },

  separador: {
    height: 1,
  },

  datos: {
    flexDirection: "row",
  },

  dato: {
    flex: 1,
  },

  datoEtiqueta: {
    fontSize: 11,
  },

  datoValor: {
    fontSize: 14,
    fontWeight: "800",
  },

  pie: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },

  botonCancelar: {
    height: 48,
    marginTop: 16,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
  },

  botonCancelarTexto: {
    fontSize: 16,
    fontWeight: "700",
  },

  botonSeguir: {
    alignSelf: "stretch",
    marginTop: 12,
  },
});
