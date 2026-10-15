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
      <Pressable
        onPress={manejarRegreso}
        style={estilos.botonAtras}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Regresar a la pantalla anterior"
      >
        <Ionicons name="arrow-back" size={24} color={paletaColores.texto} />
      </Pressable>
      
      <Text style={estilos.tituloCabecera} numberOfLines={1}>
        {titulo}
      </Text>
      
      <View style={estilos.contenedorDerecho}>
        {componenteDerecho ?? <View style={estilos.espacioDerecho} />}
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
    paddingTop: 6,
  },
  botonAtras: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tituloCabecera: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: '700',
    color: paletaColores.texto,
  },
  contenedorDerecho: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  espacioDerecho: {
    width: 44,
  },
});
