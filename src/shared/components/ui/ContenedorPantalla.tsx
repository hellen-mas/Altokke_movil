import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
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
      {conScroll ? (
        <KeyboardAwareScrollView
          style={[
            estilos.vistaTeclado,
            { backgroundColor: colores.fondo },
          ]}
          contentContainerStyle={[
            estilos.contenidoScroll,
            { backgroundColor: colores.fondo },
            estiloContenedorContenido,
          ]}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraHeight={150}
          extraScrollHeight={150}
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
  },
  vistaTeclado: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
  },
});
