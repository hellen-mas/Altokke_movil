import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
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
  tamanoIcono = 17,
  cargando = false,
  disabled = false,
  mostrarIcono = false,
  icono = "arrow-forward",
}: PropsBotonPrincipal) {
  const { colores } = useAltokkeTheme();
  const bloqueado = disabled || cargando;

  return (
    <Pressable
      style={({ pressed }) => [
        estilos.boton,
        {
          backgroundColor: bloqueado
            ? colores.primarioDeshabilitado
            : pressed
            ? colores.primarioPresionado
            : colores.primario,
        },
        estilo,
      ]}
      disabled={bloqueado}
      onPress={onPress || alPresionar}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: bloqueado, busy: cargando }}
    >
      {cargando ? (
        <ActivityIndicator color={colores.textoBoton} size="small" />
      ) : (
        <View style={estilos.contenido}>
          <Text
            style={[
              estilos.texto, 
              { color: colores.textoBoton },
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
              color={colores.textoBoton}
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
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 0,
  },
  texto: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0,
    textAlign: "center",
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});

export default BotonPrincipal;
