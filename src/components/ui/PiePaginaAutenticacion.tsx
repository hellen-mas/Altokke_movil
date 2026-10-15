import { Href, router } from "expo-router";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";
import { paletaColores } from "@/paletaColores";

interface PropsPiePaginaAutenticacion {
  textoPregunta: string;
  textoEnlace: string;
  ruta: Href;
  alineacion?: "left" | "center" | "right";
  mostrarBorde?: boolean;
  variante?: "oscuro" | "claro";
  tamanoTexto?: number;
  estiloPregunta?: StyleProp<TextStyle>;
  estiloEnlace?: StyleProp<TextStyle>;
}

export const PiePaginaAutenticacion = ({
  textoPregunta,
  textoEnlace,
  ruta,
  alineacion = "center",
  mostrarBorde = false,
  variante = "oscuro",
  tamanoTexto,
  estiloPregunta,
  estiloEnlace,
}: PropsPiePaginaAutenticacion) => {
  const esClaro = variante === "claro";
  const estiloTamano = tamanoTexto ? { fontSize: tamanoTexto } : null;

  return (
    <View
      style={[
        estilos.contenedor,
        mostrarBorde ? estilos.contenedorBorde : estilos.contenedorSinBorde,
        esClaro && estilos.contenedorClaro,
        { justifyContent: alineacion === "center" ? "center" : alineacion === "left" ? "flex-start" : "flex-end" },
      ]}
    >
      <View style={estilos.fila}>
        <Text
          style={[
            estilos.textoPregunta,
            esClaro && estilos.textoPreguntaClaro,
            estiloTamano,
            estiloPregunta,
          ]}
        >
          {textoPregunta}{" "}
        </Text>
        <Pressable
          onPress={() => router.push(ruta)}
          hitSlop={{ top: 12, bottom: 12, left: 10, right: 12 }}
          accessibilityRole="link"
          accessibilityLabel={`${textoPregunta} ${textoEnlace}`}
          accessibilityHint="Navega a la pantalla para iniciar sesión"
          style={({ pressed }) => [
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text
            style={[
              estilos.textoEnlace,
              esClaro && estilos.textoEnlaceClaro,
              estiloTamano,
              estiloEnlace,
            ]}
          >
            {textoEnlace}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  contenedorBorde: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  contenedorSinBorde: {
    paddingVertical: 6,
    minHeight: 48,
    justifyContent: "center",
  },
  contenedorClaro: {
    borderColor: paletaColores.bordeClaro,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  textoPregunta: {
    fontSize: 19,
    color: "#C2D4CB",
    fontWeight: "500",
  },
  textoPreguntaClaro: {
    color: paletaColores.textoSecundarioClaro,
  },
  textoEnlace: {
    fontSize: 19,
    fontWeight: "800",
    color: "#2ECE79",
  },
  textoEnlaceClaro: {
    color: paletaColores.verde,
  },
});
