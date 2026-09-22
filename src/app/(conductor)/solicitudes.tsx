import { StyleSheet, Text, View } from "react-native";

import { paletaColores } from "@/paletaColores";

export default function SolicitudesConductor() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>
        Solicitudes
      </Text>

      <Text style={styles.temporal}>
        Pantalla pendiente - Integrante correspondiente
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: paletaColores.fondoClaro,
  },

  texto: {
    fontSize: 22,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  temporal: {
    marginTop: 8,
    color: paletaColores.textoSecundarioClaro,
  },
});