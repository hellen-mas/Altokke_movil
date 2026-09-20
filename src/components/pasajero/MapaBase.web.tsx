import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { paletaColores } from "@/paletaColores";
import type { MapaBaseProps } from "./tiposMapa";

// react-native-maps no funciona en el navegador, así que aquí se dibuja un
// mapa ilustrado solo para poder ver las pantallas en la PC. En el teléfono
// se usa MapaBase.tsx (mapa real).

const POSICIONES_CONDUCTORES = [
  { top: "24%", left: "18%" },
  { top: "62%", left: "72%" },
  { top: "68%", left: "28%" },
] as const;

export function MapaBase({ conductores = [], destino, style }: MapaBaseProps) {
  return (
    <View style={[styles.mapa, style]}>
      {/* Zonas verdes y río */}
      <View style={[styles.parque, { top: "10%", left: "58%" }]} />
      <View style={[styles.parque, styles.parqueGrande, { top: "52%", left: "-6%" }]} />
      <View style={[styles.rio, { top: "6%", left: "-30%" }]} />

      {/* Calles */}
      <View style={[styles.calle, styles.calleHorizontal, { top: "26%" }]} />
      <View style={[styles.calle, styles.calleHorizontal, { top: "50%" }]} />
      <View style={[styles.calle, styles.calleHorizontal, { top: "76%" }]} />
      <View style={[styles.calle, styles.calleVertical, { left: "24%" }]} />
      <View style={[styles.calle, styles.calleVertical, { left: "52%" }]} />
      <View style={[styles.calle, styles.calleVertical, { left: "80%" }]} />

      {/* Conductores cercanos */}
      {conductores.slice(0, POSICIONES_CONDUCTORES.length).map((_, indice) => (
        <View
          key={indice}
          style={[styles.conductor, POSICIONES_CONDUCTORES[indice]]}
        >
          <Ionicons
            name="car-sport"
            size={15}
            color={paletaColores.textoOscuro}
          />
        </View>
      ))}

      {/* Destino */}
      {destino && (
        <View style={styles.destino}>
          <Ionicons name="location-sharp" size={34} color={paletaColores.error} />
        </View>
      )}

      {/* Ubicación del pasajero */}
      <View style={styles.pasajero}>
        <View style={styles.halo} />
        <View style={styles.punto} />
      </View>

      <View style={styles.botonCentrar}>
        <Ionicons name="locate" size={22} color={paletaColores.boton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapa: {
    overflow: "hidden",
    backgroundColor: "#E9EFEB",
  },

  calle: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },

  calleHorizontal: {
    left: 0,
    right: 0,
    height: 12,
  },

  calleVertical: {
    top: 0,
    bottom: 0,
    width: 12,
  },

  parque: {
    position: "absolute",
    width: 110,
    height: 80,
    borderRadius: 14,
    backgroundColor: "#CFE8D6",
  },

  parqueGrande: {
    width: 150,
    height: 110,
  },

  rio: {
    position: "absolute",
    width: "170%",
    height: 30,
    borderRadius: 15,
    backgroundColor: "#BFDDF0",
    transform: [{ rotate: "24deg" }],
  },

  conductor: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.verde,
    borderWidth: 2,
    borderColor: paletaColores.superficieClara,
  },

  destino: {
    position: "absolute",
    top: "22%",
    left: "66%",
  },

  pasajero: {
    position: "absolute",
    top: "48%",
    left: "50%",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  halo: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(47, 174, 115, 0.22)",
  },

  punto: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: paletaColores.boton,
    borderWidth: 3,
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
