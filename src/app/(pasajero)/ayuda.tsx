import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { ItemMenu } from "@/components/cuenta/ItemMenu";
import { BarraInferior } from "@/components/pasajero/BarraInferior";
import { paletaColores } from "@/paletaColores";

const TEMAS = [
  { icono: "car-outline", titulo: "Problemas con un viaje" },
  { icono: "card-outline", titulo: "Métodos de pago" },
  { icono: "shield-checkmark-outline", titulo: "Cuenta y seguridad" },
  { icono: "pricetag-outline", titulo: "Promociones y descuentos" },
  { icono: "ellipsis-horizontal", titulo: "Más temas" },
] as const;

export default function Ayuda() {
  const [busqueda, setBusqueda] = useState("");

  const temasFiltrados = TEMAS.filter((tema) =>
    tema.titulo.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <EncabezadoPantalla titulo="Ayuda" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contenido}
      >
        <View style={styles.buscador}>
          <Ionicons
            name="search-outline"
            size={18}
            color={paletaColores.textoSecundarioClaro}
          />
          <TextInput
            style={styles.inputBusqueda}
            placeholder="Buscar en Ayuda..."
            placeholderTextColor={paletaColores.textoSecundarioClaro}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCorrect={false}
          />
        </View>

        <Text style={styles.seccion}>Temas frecuentes</Text>

        {temasFiltrados.length === 0 ? (
          <Text style={styles.sinResultados}>
            No encontramos temas con esa búsqueda.
          </Text>
        ) : (
          temasFiltrados.map((tema) => (
            <ItemMenu key={tema.titulo} icono={tema.icono} titulo={tema.titulo} />
          ))
        )}

        <Pressable style={styles.soporte}>
          <Ionicons
            name="headset-outline"
            size={24}
            color={paletaColores.textoClaro}
          />
          <View style={styles.soporteTextos}>
            <Text style={styles.soporteTitulo}>Contactar soporte</Text>
            <Text style={styles.soporteSubtitulo}>Estamos para ayudarte</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={paletaColores.textoSecundarioClaro}
          />
        </Pressable>
      </ScrollView>

      <BarraInferior activa="ayuda" />
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
    paddingBottom: 24,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#EEF2F0",
  },

  inputBusqueda: {
    flex: 1,
    fontSize: 14,
    color: paletaColores.textoClaro,
  },

  seccion: {
    marginTop: 22,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  sinResultados: {
    marginTop: 16,
    fontSize: 13,
    color: paletaColores.textoSecundarioClaro,
  },

  soporte: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#EEF2F0",
  },

  soporteTextos: {
    flex: 1,
  },

  soporteTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  soporteSubtitulo: {
    marginTop: 2,
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },
});
