import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { IconoMototaxi } from "./IconoMototaxi";
import type { MapaBaseProps } from "@/features/viajes/types/tiposMapa";

const ZOOM_INICIAL = 0.012;
const RELLENO_AJUSTE = { top: 70, right: 60, bottom: 70, left: 60 };

export function MapaGoogle({
  centro,
  origen,
  ubicacionActual,
  onSeleccionarPunto,
  destino,
  ruta,
  conductores = [],
  interactivo = true,
  margenInferior = 0,
  style,
}: MapaBaseProps) {
  const { colores } = useAltokkeTheme();
  const mapaRef = useRef<MapView>(null);
  const posicionPasajero = ubicacionActual ?? origen ?? centro;

  // Cuando hay origen y destino, se encuadra la ruta completa
  useEffect(() => {
    if (!origen || !destino) return;

    mapaRef.current?.fitToCoordinates([origen, destino], {
      edgePadding: RELLENO_AJUSTE,
      animated: true,
    });
  }, [origen, destino]);

  const centrarEnPasajero = () => {
    mapaRef.current?.animateToRegion(
      {
        ...posicionPasajero,
        latitudeDelta: ZOOM_INICIAL,
        longitudeDelta: ZOOM_INICIAL,
      },
      400,
    );
  };

  return (
    <View style={[styles.contenedor, style]}>
      <MapView
        ref={mapaRef}
        style={styles.mapa}
        onLongPress={(evento) => {
          if (!interactivo) return;

          onSeleccionarPunto?.(evento.nativeEvent.coordinate);
        }}
        initialRegion={{
          ...centro,
          latitudeDelta: ZOOM_INICIAL,
          longitudeDelta: ZOOM_INICIAL,
        }}
        // Sube el logo del mapa y centra el contenido en la parte que sí se ve
        mapPadding={{ top: 0, left: 0, right: 0, bottom: margenInferior }}
        scrollEnabled={interactivo}
        zoomEnabled={interactivo}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
      >
        {ruta && ruta.length > 1 && (
          <Polyline
            coordinates={ruta}
            strokeColor={colores.primario}
            strokeWidth={5}
          />
        )}

        {conductores.map((conductor, indice) => (
          <Marker
            key={indice}
            coordinate={conductor}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.conductor, { borderColor: colores.superficie }]}>
              <IconoMototaxi size={18} color="#1F2937" />
            </View>
          </Marker>
        ))}

        {destino && (
          <Marker coordinate={destino} pinColor={colores.error} />
        )}

        {/* Punto de recojo: permanece fijo */}
        <Marker 
          coordinate={origen ?? centro} 
          anchor={{ x: 0.5, y: 0.5 }}
          title="Punto de recojo"
        >
          <View style={styles.halo}>
            <View
              style={[
                styles.punto,
                {
                  backgroundColor: colores.primario,
                  borderColor: colores.superficie,
                },
              ]}
            />
          </View>
        </Marker>

        {/* Ubicación GPS actual del pasajero */}
        {ubicacionActual && (
          <Marker
            coordinate={ubicacionActual}
            anchor={{ x: 0.5, y: 0.5}}
            title="Mi ubicación actual"
            tracksViewChanges
          >
            <View style={styles.haloGPS}>
              <View style={styles.puntoGPS}/>
            </View>
          </Marker>
        )}
      </MapView>

      <Pressable
        style={[
          styles.botonCentrar,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
        onPress={centrarEnPasajero}
      >
        <Ionicons name="locate" size={22} color={colores.primario} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    overflow: "hidden",
    backgroundColor: "#EAF0EC",
  },

  mapa: {
    width: "100%",
    height: "100%",
  },

  halo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47, 174, 115, 0.22)",
  },

  haloGPS: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  punto: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },

  puntoGPS: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  conductor: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2FAE73",
    borderWidth: 2,
  },

  botonCentrar: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
});
