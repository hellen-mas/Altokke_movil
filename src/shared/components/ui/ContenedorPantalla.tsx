import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PropsContenedorPantalla {
  children: React.ReactNode;
  estilo?: StyleProp<ViewStyle>;
  estiloContenedorContenido?: StyleProp<ViewStyle>;
  conScroll?: boolean;
}

export function ContenedorPantalla({
  children,
  estilo,
  estiloContenedorContenido,
  conScroll = true,
}: PropsContenedorPantalla) {
  const { colores } = useAltokkeTheme();

  return (
    <SafeAreaView 
      style={[
        estilos.areaSegura,
        {
          backgroundColor: colores.fondo,
        },
        estilo,
      ]}>
      <KeyboardAvoidingView
        style={estilos.vistaTeclado}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {conScroll ? (
          <ScrollView
            style={[
              estilos.vistaTeclado,
              { backgroundColor: colores.fondo },
            ]}
            contentContainerStyle={[
              estilos.contenidoScroll,
              { backgroundColor: colores.fondo },
              estiloContenedorContenido,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  areaSegura: {
    flex: 1,
  },
  vistaTeclado: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
  },
});
