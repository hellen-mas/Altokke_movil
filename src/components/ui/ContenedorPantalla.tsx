import { paletaColores } from "@/paletaColores";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
        <KeyboardAwareScrollView
          style={estilos.vistaTeclado}
          contentContainerStyle={[estilos.contenidoScroll, estiloContenedorContenido]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          {children}
        </KeyboardAwareScrollView>
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
