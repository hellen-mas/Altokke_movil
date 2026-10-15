import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export interface PropsBotonPrincipal {
  titulo: string;
  onPress?: () => void;
  alPresionar?: () => void;
  estilo?: StyleProp<ViewStyle>;
  estiloTexto?: StyleProp<TextStyle>;
  tamanoIcono?: number;
  cargando?: boolean;
  disabled?: boolean;
}

export function BotonPrincipal({
  titulo,
  onPress,
  alPresionar,
  estilo,
  estiloTexto,
  tamanoIcono,
  cargando,
  disabled
}: PropsBotonPrincipal) {
  const funcionAccion = onPress || alPresionar;

  return (
    <Pressable
      style={({ pressed }) => [
        estilos.boton,
        estilo,
        (disabled || cargando) && estilos.disabled,
        pressed && !disabled && !cargando && { backgroundColor: paletaColores.botonPresionado },
        pressed && estilos.presionado,
      ]}
      disabled={disabled || cargando}
      onPress={funcionAccion}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: disabled || cargando, busy: cargando }}
    >
      {cargando ? (
        <ActivityIndicator color={paletaColores.textoOscuro} />
      ) : (
        <View style={estilos.contenido}>
          <Text style={[estilos.texto, estiloTexto]} numberOfLines={2}>
            {titulo}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={tamanoIcono ?? 24}
            color={paletaColores.textoOscuro}
          />
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: "100%",
    minHeight: 60,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.boton,
    borderRadius: 18,
    marginTop: 3,
  },
  texto: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.2,
    color: paletaColores.textoOscuro,
    textAlign: "center",
  },
  disabled: {
    backgroundColor: "#A0A0A0",
  },
  presionado: {
    transform: [{ scale: 0.98 }]
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

export default BotonPrincipal;
