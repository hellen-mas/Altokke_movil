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
  tamanoIcono = 22,
  cargando = false,
  disabled = false,
  mostrarIcono = false,
  icono = "arrow-forward",
}: PropsBotonPrincipal) {
  const bloqueado = disabled || cargando;

  return (
    <Pressable
      style={({ pressed }) => [
        estilos.boton,
        estilo,
        bloqueado && estilos.disabled,
        pressed && !bloqueado && estilos.presionado,
      ]}
      disabled={bloqueado}
      onPress={onPress || alPresionar}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: bloqueado, busy: cargando }}
    >
      {cargando ? (
        <ActivityIndicator color={paletaColores.textOnPrimary} size="small" />
      ) : (
        <View style={estilos.contenido}>
          <Text
            style={[estilos.texto, bloqueado && estilos.textoDisabled, estiloTexto]}
            numberOfLines={2}
          >
            {titulo}
          </Text>
          {mostrarIcono && (
            <Ionicons
              name={icono}
              size={tamanoIcono}
              color={bloqueado ? paletaColores.disabledText : paletaColores.textOnPrimary}
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
    minHeight: 64,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.primary,
    borderRadius: 16,
  },
  texto: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: paletaColores.textOnPrimary,
    textAlign: "center",
  },
  textoDisabled: {
    color: paletaColores.disabledText,
  },
  disabled: {
    backgroundColor: paletaColores.primaryMuted,
    opacity: 0.8,
  },
  presionado: {
    backgroundColor: paletaColores.primaryHover,
    opacity: 0.92,
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});

export default BotonPrincipal;
