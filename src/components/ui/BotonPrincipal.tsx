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
  mostrarIcono?: boolean;
  icono?: keyof typeof Ionicons.glyphMap;
}

export function BotonPrincipal({
  titulo,
  onPress,
  alPresionar,
  estilo,
  estiloTexto,
  tamanoIcono = 20,
  cargando,
  disabled,
  mostrarIcono = false,
  icono = "arrow-forward",
}: PropsBotonPrincipal) {
  const funcionAccion = onPress || alPresionar;
  const estaDeshabilitado = disabled || cargando;

  return (
    <Pressable
      style={({ pressed }) => [
        estilos.boton,
        estilo,
        estaDeshabilitado && estilos.disabled,
        pressed && !estaDeshabilitado && estilos.presionado,
      ]}
      disabled={estaDeshabilitado}
      onPress={funcionAccion}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: estaDeshabilitado, busy: cargando }}
    >
      {cargando ? (
        <ActivityIndicator color={paletaColores.textoOscuro} />
      ) : (
        <View style={estilos.contenido}>
          <Text
            style={[
              estilos.texto,
              estaDeshabilitado && estilos.textoDisabled,
              estiloTexto,
            ]}
            numberOfLines={2}
          >
            {titulo}
          </Text>
          {mostrarIcono && (
            <Ionicons
              name={icono}
              size={tamanoIcono}
              color={estaDeshabilitado ? paletaColores.disabledTexto : paletaColores.textoOscuro}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: "100%",
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.boton,
    borderRadius: 14,
    marginTop: 4,
  },
  texto: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
    color: paletaColores.textoOscuro,
    textAlign: "center",
  },
  textoDisabled: {
    color: paletaColores.disabledTexto,
  },
  disabled: {
    backgroundColor: paletaColores.disabled,
  },
  presionado: {
    backgroundColor: paletaColores.botonPresionado,
    transform: [{ scale: 0.99 }],
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});

export default BotonPrincipal;

