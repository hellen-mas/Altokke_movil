import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
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
  const { colores } = useAltokkeTheme();

  return (
    <View
      style={[
        estilos.contenedor,
        mostrarBorde && {
          borderTopWidth: 1,
          borderTopColor: colores.linea,
          marginTop: 12,
          paddingTop: 16,
        },
        {
          justifyContent:
            alineacion === "left"
              ? "flex-start"
              : alineacion === "right"
              ? "flex-end"
              : "center",
        },
        estilo,
      ]}
    >
      <View style={estilos.fila}>
        <Text 
          style={[
            estilos.textoPregunta, 
            { color: colores.secundario },
            estiloPregunta,
          ]}>
          {textoPregunta}{" "}
        </Text>
        <Pressable
          onPress={() => router.push(ruta)}
          hitSlop={10}
          accessibilityRole="link"
          accessibilityLabel={`${textoPregunta} ${textoEnlace}`}
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
        >
          <Text 
            style={[
              estilos.textoEnlace, 
              { color: colores.exitoTexto },
              estiloEnlace,
            ]}>
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
  fila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  textoPregunta: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
  },
  textoEnlace: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
  },
});

export default PiePaginaAutenticacion;
