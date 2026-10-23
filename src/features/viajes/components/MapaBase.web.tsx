import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { IconoMototaxi } from "./IconoMototaxi";
import type { MapaBaseProps } from "@/features/viajes/types/tiposMapa";

// react-native-maps no funciona en el navegador, así que aquí se dibuja un
// mapa ilustrado solo para poder ver las pantallas en la PC. En el teléfono
// se usa MapaBase.tsx (mapa real).

const POSICIONES_CONDUCTORES = [
  { top: "24%", left: "18%" },
  { top: "62%", left: "72%" },
  { top: "68%", left: "28%" },
] as const;

export function MapaBase({ conductores = [], destino, style }: MapaBaseProps) {
  const { colores, esOscuro } = useAltokkeTheme();

  return (
    <View style={[styles.mapa, esOscuro && styles.mapaOscuro, style]}>
      {/* Zonas verdes y río */}
      <View style={[styles.parque, esOscuro && styles.parqueOscuro, { top: "10%", left: "58%" }]} />
      <View style={[styles.parque, styles.parqueGrande, esOscuro && styles.parqueOscuro, { top: "52%", left: "-6%" }]} />
      <View style={[styles.rio, esOscuro && styles.rioOscuro, { top: "6%", left: "-30%" }]} />

      {/* Calles */}
      <View style={[styles.calle, styles.calleHorizontal, esOscuro && styles.calleOscura, { top: "26%" }]} />
      <View style={[styles.calle, styles.calleHorizontal, esOscuro && styles.calleOscura, { top: "50%" }]} />
      <View style={[styles.calle, styles.calleHorizontal, esOscuro && styles.calleOscura, { top: "76%" }]} />
      <View style={[styles.calle, styles.calleVertical, esOscuro && styles.calleOscura, { left: "24%" }]} />
      <View style={[styles.calle, styles.calleVertical, esOscuro && styles.calleOscura, { left: "52%" }]} />
      <View style={[styles.calle, styles.calleVertical, esOscuro && styles.calleOscura, { left: "80%" }]} />

      {/* Conductores cercanos */}
      {conductores.slice(0, POSICIONES_CONDUCTORES.length).map((_, indice) => (
        <View
          key={indice}
          style={[
            styles.conductor,
            { borderColor: colores.superficie },
            POSICIONES_CONDUCTORES[indice],
          ]}
        >
          <IconoMototaxi size={18} color="#1F2937" />
        </View>
      ))}

      {/* Destino */}
      {destino && (
        <View style={styles.destino}>
          <Ionicons name="location-sharp" size={34} color={colores.error} />
        </View>
      )}

      {/* Ubicación del pasajero */}
      <View style={styles.pasajero}>
        <View style={styles.halo} />
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

      <View
        style={[
          styles.botonCentrar,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        <Ionicons name="locate" size={22} color={colores.primario} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapa: {
    overflow: "hidden",
    backgroundColor: "#E9EFEB",
  },

  mapaOscuro: {
    backgroundColor: "#111A15",
  },

  calle: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },

  calleOscura: {
    backgroundColor: "#1F2F26",
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

  parqueOscuro: {
    backgroundColor: "#193525",
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

  rioOscuro: {
    backgroundColor: "#182E3E",
  },

  conductor: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2FAE73",
    borderWidth: 2,
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
    borderWidth: 3,
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
