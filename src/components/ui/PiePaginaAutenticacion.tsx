import { paletaColores } from "@/paletaColores";
import { Href, router } from "expo-router";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export interface PropsPiePaginaAutenticacion {
  textoPregunta: string;
  textoEnlace: string;
  ruta: Href;
  alineacion?: "left" | "center" | "right";
  mostrarBorde?: boolean;
  variante?: "oscuro" | "claro" | string;
  estilo?: StyleProp<ViewStyle>;
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
  estilo,
  estiloPregunta,
  estiloEnlace,
}: PropsPiePaginaAutenticacion) => {
  const esClaro = variante === "claro";

  return (
    <View
      style={[
        estilos.contenedor,
        mostrarBorde && (esClaro ? estilos.bordeClaro : estilos.bordeOscuro),
        { justifyContent: alineacion === "left" ? "flex-start" : alineacion === "right" ? "flex-end" : "center" },
        estilo,
      ]}
    >
      <View style={estilos.fila}>
        <Text style={[estilos.textoPregunta, esClaro && estilos.textoPreguntaClaro, estiloPregunta]}>
          {textoPregunta}{" "}
        </Text>
        <Pressable
          onPress={() => router.push(ruta)}
          hitSlop={10}
          accessibilityRole="link"
          accessibilityLabel={`${textoPregunta} ${textoEnlace}`}
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
        >
          <Text style={[estilos.textoEnlace, esClaro && estilos.textoEnlaceClaro, estiloEnlace]}>
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
    paddingVertical: 10,
    minHeight: 52,
    alignItems: "center",
  },
  bordeOscuro: {
    borderTopWidth: 1,
    borderTopColor: paletaColores.surfaceBorder,
    marginTop: 12,
    paddingTop: 16,
  },
  bordeClaro: {
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
    marginTop: 12,
    paddingTop: 16,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  textoPregunta: {
    fontSize: 17,
    lineHeight: 24,
    color: paletaColores.textSecondary,
    fontWeight: "500",
  },
  textoPreguntaClaro: {
    color: paletaColores.textoSecundarioClaro,
  },
  textoEnlace: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: paletaColores.primary,
  },
  textoEnlaceClaro: {
    color: paletaColores.primaryHover,
  },
});

export default PiePaginaAutenticacion;
