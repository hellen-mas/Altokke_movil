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
  estilo
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
      <Pressable onPress={manejarRegreso} style={estilos.botonAtras} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={paletaColores.texto} />
      </Pressable>
      
      <Text style={estilos.tituloCabecera}>{titulo}</Text>
      
      <View style={estilos.contenedorDerecho}>
        {componenteDerecho ? componenteDerecho : <View style={{ width: 24 }} />}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabeceraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingTop: 10,
  },
  botonAtras: {
    padding: 4,
    width: 40,
  },
  tituloCabecera: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: '700',
    color: paletaColores.texto,
  },
  contenedorDerecho: {
    width: 80,
    alignItems: 'flex-end',
  }
});
