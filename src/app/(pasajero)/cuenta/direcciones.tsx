import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { DIRECCIONES_DEMO } from "@/constants/cuenta";
import { paletaColores } from "@/paletaColores";

export default function DireccionesGuardadas() {
  return (
    <View style={styles.container}>
      <EncabezadoPantalla titulo="Direcciones guardadas" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {DIRECCIONES_DEMO.map((lugar) => (
          <View key={lugar.id} style={styles.fila}>
            <Ionicons
              name={lugar.icono}
              size={22}
              color={paletaColores.textoClaro}
            />

            <View style={styles.textos}>
              <Text style={styles.nombre}>{lugar.nombre}</Text>
              <Text style={styles.direccion}>{lugar.direccion}</Text>
            </View>

            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={paletaColores.textoSecundarioClaro}
            />
          </View>
        ))}

        <Pressable style={styles.fila}>
          <Ionicons
            name="add-circle"
            size={22}
            color={paletaColores.textoClaro}
          />
          <Text style={styles.agregar}>Agregar nueva dirección</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paletaColores.bordeClaro,
  },

  textos: {
    flex: 1,
  },

  nombre: {
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  direccion: {
    marginTop: 2,
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  agregar: {
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },
});
