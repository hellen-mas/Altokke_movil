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
  mostrarBorde,
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
        {
          justifyContent:
            alineacion === "center"
              ? "center"
              : alineacion === "left"
              ? "flex-start"
              : "flex-end",
        },
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
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="link"
          accessibilityLabel={`${textoPregunta} ${textoEnlace}`}
          accessibilityHint="Navega a la pantalla para continuar"
          style={({ pressed }) => [
            pressed && { opacity: 0.7 },
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
    paddingVertical: 8,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  textoPregunta: {
    fontSize: 16,
    lineHeight: 24,
    color: paletaColores.textoSecundario,
    fontWeight: "500",
  },
  textoPreguntaClaro: {
    color: paletaColores.textoSecundarioClaro,
  },
  textoEnlace: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: paletaColores.boton,
  },
  textoEnlaceClaro: {
    color: paletaColores.verde,
  },
});


