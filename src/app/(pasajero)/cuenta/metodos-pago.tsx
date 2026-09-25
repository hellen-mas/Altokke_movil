import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { IdMetodoPago, METODOS_PAGO } from "@/constants/cuenta";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

function LogoMetodo({ id }: { id: IdMetodoPago }) {
  if (id === "efectivo") {
    return (
      <View style={[styles.logo, { backgroundColor: paletaColores.boton }]}>
        <Ionicons name="cash-outline" size={22} color="#FFFFFF" />
      </View>
    );
  }

  const esYape = id === "yape";

  return (
    <View
      style={[styles.logo, { backgroundColor: esYape ? "#742284" : "#00C2CB" }]}
    >
      <Text style={styles.textoLogo}>{esYape ? "yape" : "plin"}</Text>
    </View>
  );
}

export default function MetodosPago() {
  const [principal, setPrincipal] = useState<IdMetodoPago>("efectivo");

  return (
    <View style={styles.container}>
      <EncabezadoPantalla titulo="Métodos de pago" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {METODOS_PAGO.map((metodo) => {
          const esPrincipal = metodo.id === principal;

          return (
            <Pressable
              key={metodo.id}
              style={styles.fila}
              onPress={() => setPrincipal(metodo.id)}
            >
              <LogoMetodo id={metodo.id} />

              <View style={styles.textos}>
                <Text style={styles.nombre}>{metodo.nombre}</Text>
                <Text style={styles.descripcion}>{metodo.descripcion}</Text>
              </View>

              {esPrincipal && (
                <View style={styles.insignia}>
                  <Text style={styles.textoInsignia}>Principal</Text>
                </View>
              )}

              <Ionicons
                name={esPrincipal ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={
                  esPrincipal
                    ? paletaColores.boton
                    : paletaColores.textoSecundarioClaro
                }
              />
            </Pressable>
          );
        })}

        <Text style={styles.aviso}>
          Toca un método para elegirlo como principal.
        </Text>
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
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: paletaColores.bordeClaro,
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textoLogo: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  textos: {
    flex: 1,
  },

  nombre: {
    fontSize: 15,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  descripcion: {
    marginTop: 2,
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  insignia: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#E6F5EC",
  },

  textoInsignia: {
    fontSize: 11,
    fontWeight: "600",
    color: paletaColores.boton,
  },

  aviso: {
    marginTop: 20,
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },
});
