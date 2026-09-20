import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { paletaColores } from "@/paletaColores";
import type { MapaBaseProps } from "./tiposMapa";

const ZOOM_INICIAL = 0.012;
const RELLENO_AJUSTE = { top: 70, right: 60, bottom: 70, left: 60 };

export function MapaBase({
  centro,
  origen,
  destino,
  ruta,
  conductores = [],
  interactivo = true,
  style,
}: MapaBaseProps) {
  const mapaRef = useRef<MapView>(null);
  const posicionPasajero = origen ?? centro;

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
        initialRegion={{
          ...centro,
          latitudeDelta: ZOOM_INICIAL,
          longitudeDelta: ZOOM_INICIAL,
        }}
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
            strokeColor={paletaColores.boton}
            strokeWidth={5}
          />
        )}

        {conductores.map((conductor, indice) => (
          <Marker
            key={indice}
            coordinate={conductor}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.conductor}>
              <Ionicons
                name="car-sport"
                size={15}
                color={paletaColores.textoOscuro}
              />
            </View>
          </Marker>
        ))}

        {destino && (
          <Marker coordinate={destino} pinColor={paletaColores.error} />
        )}

        <Marker coordinate={posicionPasajero} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.halo}>
            <View style={styles.punto} />
          </View>
        </Marker>
      </MapView>

      <Pressable style={styles.botonCentrar} onPress={centrarEnPasajero}>
        <Ionicons name="locate" size={22} color={paletaColores.boton} />
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

  punto: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: paletaColores.boton,
    borderWidth: 3,
    borderColor: paletaColores.superficieClara,
  },

  conductor: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.verde,
    borderWidth: 2,
    borderColor: paletaColores.superficieClara,
  },

  botonCentrar: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },
});
