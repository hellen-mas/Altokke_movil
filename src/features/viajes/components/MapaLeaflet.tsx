import { StyleSheet, Text, View } from "react-native";
import type { MapaBaseProps } from "@/features/viajes/types/tiposMapa";

export function MapaLeaflet({ style }: MapaBaseProps) {
  return (
    <View style={[styles.contenedor, style]}>
      <Text>Aquí irá el mapa de leaflet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF0EC",
  },
});
