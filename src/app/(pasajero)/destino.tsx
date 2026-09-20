import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BarraInferior } from "@/components/pasajero/BarraInferior";
import { CabeceraPasajero } from "@/components/pasajero/CabeceraPasajero";
import { MapaBase } from "@/components/pasajero/MapaBase";
import {
  CENTRO_BAGUA,
  Lugar,
  LUGARES_BAGUA,
  ORIGEN_EJEMPLO,
} from "@/constants/pasajero";
import { useViaje } from "@/context/ViajeContext";
import { paletaColores } from "@/paletaColores";

// Quita tildes y mayúsculas para que "helices" encuentre "Héroes"
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function filtrarLugares(busqueda: string) {
  const termino = normalizar(busqueda);

  if (!termino) return LUGARES_BAGUA;

  return LUGARES_BAGUA.filter(
    (lugar) =>
      normalizar(lugar.nombre).includes(termino) ||
      normalizar(lugar.detalle).includes(termino),
  );
}

export default function PantallaDestino() {
  const { destino, setDestino } = useViaje();
  const [busqueda, setBusqueda] = useState(destino?.nombre ?? "");

  // Si ya hay un destino elegido, se muestra la lista completa para poder cambiarlo
  const resultados =
    destino && destino.nombre === busqueda
      ? LUGARES_BAGUA
      : filtrarLugares(busqueda);

  const cambiarBusqueda = (texto: string) => {
    setBusqueda(texto);

    if (destino && texto !== destino.nombre) {
      setDestino(null);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setDestino(null);
  };

  const seleccionarLugar = (lugar: Lugar) => {
    setDestino(lugar);
    setBusqueda(lugar.nombre);
    Keyboard.dismiss();
    // router.push("/confirmar-viaje");
  };

  return (
    <View style={styles.pantalla}>
      <CabeceraPasajero subtitulo="¿A dónde te llevamos hoy?" />

      <MapaBase
        centro={CENTRO_BAGUA}
        origen={ORIGEN_EJEMPLO.coordenadas}
        destino={destino?.coordenadas}
        style={styles.mapa}
      />

      <View style={styles.panel}>
        <View style={styles.asa} />

        {/* Origen */}
        <View style={styles.filaOrigen}>
          <View style={styles.iconoOrigen}>
            <Ionicons name="radio-button-on" size={20} color={paletaColores.boton} />
          </View>

          <View style={styles.textoOrigen}>
            <Text style={styles.etiqueta}>Origen</Text>
            <Text style={styles.origenNombre}>{ORIGEN_EJEMPLO.nombre}</Text>
          </View>

          <View style={styles.botonIntercambio}>
            <Ionicons
              name="swap-vertical"
              size={18}
              color={paletaColores.textoSecundarioClaro}
            />
          </View>
        </View>

        {/* Destino */}
        <View style={styles.campoDestino}>
          <Ionicons name="location-sharp" size={20} color={paletaColores.boton} />

          <View style={styles.campoDestinoTexto}>
            <Text style={styles.etiqueta}>Destino</Text>
            <TextInput
              value={busqueda}
              onChangeText={cambiarBusqueda}
              placeholder="¿A dónde vamos?"
              placeholderTextColor={paletaColores.textoSecundarioClaro}
              style={styles.input}
              autoCorrect={false}
            />
          </View>

          {busqueda.length > 0 && (
            <Pressable onPress={limpiarBusqueda} hitSlop={10}>
              <Ionicons
                name="close-circle"
                size={22}
                color={paletaColores.textoSecundarioClaro}
              />
            </Pressable>
          )}
        </View>

        {/* Sugerencias */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
        >
          {resultados.length === 0 && (
            <Text style={styles.sinResultados}>
              No encontramos lugares con “{busqueda}”.
            </Text>
          )}

          {resultados.map((lugar) => {
            const elegido = lugar.id === destino?.id;

            return (
              <Pressable
                key={lugar.id}
                onPress={() => seleccionarLugar(lugar)}
                style={({ pressed }) => [
                  styles.lugar,
                  (pressed || elegido) && styles.lugarResaltado,
                ]}
              >
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={paletaColores.textoSecundarioClaro}
                />

                <View style={styles.lugarTextos}>
                  <Text style={styles.lugarNombre}>{lugar.nombre}</Text>
                  <Text style={styles.lugarDetalle}>{lugar.detalle}</Text>
                </View>

                <Ionicons
                  name={elegido ? "checkmark-circle" : "chevron-forward"}
                  size={elegido ? 22 : 18}
                  color={
                    elegido
                      ? paletaColores.boton
                      : paletaColores.textoSecundarioClaro
                  }
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <BarraInferior activa="inicio" />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  mapa: {
    height: 200,
  },

  panel: {
    flex: 1,
    marginTop: -22,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: paletaColores.superficieClara,
    borderTopWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  asa: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    backgroundColor: paletaColores.bordeClaro,
  },

  filaOrigen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#F3F6F4",
  },

  iconoOrigen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5F8EF",
  },

  textoOrigen: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
  },

  origenNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  botonIntercambio: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.superficieClara,
  },

  campoDestino: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1.5,
    borderColor: paletaColores.boton,
  },

  campoDestinoTexto: {
    flex: 1,
  },

  input: {
    paddingVertical: 2,
    fontSize: 16,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  lista: {
    paddingTop: 8,
    paddingBottom: 12,
  },

  sinResultados: {
    paddingVertical: 24,
    textAlign: "center",
    fontSize: 14,
    color: paletaColores.textoSecundarioClaro,
  },

  lugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  lugarResaltado: {
    backgroundColor: "#EAF8F1",
  },

  lugarTextos: {
    flex: 1,
  },

  lugarNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  lugarDetalle: {
    fontSize: 12,
    marginTop: 1,
    color: paletaColores.textoSecundarioClaro,
  },
});
