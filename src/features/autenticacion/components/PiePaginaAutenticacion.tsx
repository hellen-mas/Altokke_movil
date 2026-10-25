import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
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
  estilo,
  estiloPregunta,
  estiloEnlace,
}: PropsPiePaginaAutenticacion) => {
  const { colores } = useAltokkeTheme();
  const justify = alineacion === "left" ? "flex-start" : alineacion === "right" ? "flex-end" : "center";

  return (
    <View
      style={[
        styles.contenedor,
        mostrarBorde && { borderTopWidth: 1, borderTopColor: colores.linea, marginTop: 12, paddingTop: 16 },
        { justifyContent: justify },
        estilo,
      ]}
    >
      <View style={styles.fila}>
        <Text style={[styles.textoPregunta, { color: colores.secundario }, estiloPregunta]}>
          {textoPregunta}{" "}
        </Text>
        <Pressable
          onPress={() => router.push(ruta)}
          hitSlop={10}
          accessibilityRole="link"
          accessibilityLabel={`${textoPregunta} ${textoEnlace}`}
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
        >
          <Text style={[styles.textoEnlace, { color: colores.exitoTexto }, estiloEnlace]}>
            {textoEnlace}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { width: "100%", paddingVertical: 10, minHeight: 52, alignItems: "center" },
  fila: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  textoPregunta: { fontSize: 15, lineHeight: 24, fontWeight: "500" },
  textoEnlace: { fontSize: 17, lineHeight: 24, fontWeight: "700" },
});

export default PiePaginaAutenticacion;
