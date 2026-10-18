import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";

interface Props {
  titulo?: string;
  alRegresar?: () => void;
  componenteDerecho?: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
}

export function BarraNavegacionSuperior({
  titulo = "Altokke",
  alRegresar,
  componenteDerecho,
  estilo,
}: Props) {
  const manejarRegreso = () => {
    if (alRegresar) {
      alRegresar();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[estilos.cabeceraSuperior, estilo]}>
      <Pressable
        onPress={manejarRegreso}
        style={({ pressed }) => [
          estilos.botonAtras,
          pressed && { opacity: 0.7 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Regresar a la pantalla anterior"
      >
        <Ionicons name="arrow-back" size={22} color={paletaColores.texto} />
      </Pressable>

      <View style={estilos.contenedorTitulo} pointerEvents="none">
        <Text style={estilos.tituloCabecera} numberOfLines={1}>
          {titulo}
        </Text>
      </View>

      <View style={estilos.contenedorDerecho}>
        {componenteDerecho ?? <View style={estilos.espacioDerecho} />}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabeceraSuperior: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    marginBottom: 8,
    marginTop: 2,
  },
  botonAtras: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 1,
  },
  contenedorTitulo: {
    position: "absolute",
    left: 48,
    right: 48,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  tituloCabecera: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: paletaColores.texto,
    letterSpacing: -0.3,
  },
  contenedorDerecho: {
    minWidth: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
    zIndex: 1,
  },
  espacioDerecho: {
    width: 44,
  },
});

