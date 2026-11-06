import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { paletaColores } from "@/paletaColores";
import { IconoMototaxi } from "./IconoMototaxi";
import type { MapaBaseProps } from "./tiposMapa";

const ZOOM_INICIAL = 0.012;
const RELLENO_AJUSTE = { top: 70, right: 60, bottom: 70, left: 60 };

// En Android con Expo Go los mosaicos de Google Maps no cargan (el mapa sale
// negro), así que allí se dibujan mosaicos de OpenStreetMap. En iOS se usa el
// mapa normal. En una app compilada con clave de Google se puede quitar esto.
const USAR_MOSAICOS_OSM = Platform.OS === "android";
const URL_MOSAICOS_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function MapaBase({
  centro,
  origen,
  destino,
  ruta,
  conductores = [],
  interactivo = true,
  margenInferior = 0,
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
        // Sube el logo del mapa y centra el contenido en la parte que sí se ve
        mapPadding={{ top: 0, left: 0, right: 0, bottom: margenInferior }}
        mapType={USAR_MOSAICOS_OSM ? "none" : "standard"}
        scrollEnabled={interactivo}
        zoomEnabled={interactivo}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
      >
        {USAR_MOSAICOS_OSM && (
          <UrlTile urlTemplate={URL_MOSAICOS_OSM} maximumZ={19} tileSize={256} />
        )}

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
              <IconoMototaxi size={18} color={paletaColores.textoOscuro} />
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

      {USAR_MOSAICOS_OSM && (
        <Text style={[styles.atribucion, { bottom: 4 + margenInferior }]}>
          © OpenStreetMap
        </Text>
      )}
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

  atribucion: {
    position: "absolute",
    left: 6,
    bottom: 4,
    fontSize: 10,
    color: "#3D4A44",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingHorizontal: 4,
    borderRadius: 3,
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
