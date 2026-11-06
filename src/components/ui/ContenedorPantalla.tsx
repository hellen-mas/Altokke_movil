import { paletaColores } from "@/paletaColores";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

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
  return (
    <SafeAreaView style={[estilos.areaSegura, estilo]}>
      {conScroll ? (
        <KeyboardAvoidingView
          style={estilos.vistaTeclado}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <ScrollView
            contentContainerStyle={[estilos.contenidoScroll, estiloContenedorContenido]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  vistaTeclado: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
  },
});
