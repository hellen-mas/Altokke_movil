import BottomSheet, { BottomSheetFooter } from "@gorhom/bottom-sheet";
import type { ReactNode, Ref } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

interface Props {
  children: ReactNode;
  footer?: ReactNode;
  referencia?: Ref<BottomSheet>;
  posicionInicial?: number;
  posiciones?: (string | number)[];
  alCambiarPosicion?: (indice: number) => void;
}

export function PanelDeslizableViaje({
  children,
  footer,
  referencia,
  posicionInicial = 1,
  posiciones,
  alCambiarPosicion,
}: Props) {
  const { colores } = useAltokkeTheme();
  const insets = useSafeAreaInsets();
  const posicionesBase = useMemo(() => ["22%", "58%", "90%"], []);

  return (
    <BottomSheet
      ref={referencia}
      index={posicionInicial}
      snapPoints={posiciones ?? posicionesBase}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      enableHandlePanningGesture
      // Solo la rayita mueve el panel; el contenido desplaza la lista.
      enableContentPanningGesture={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onChange={alCambiarPosicion}
      backgroundStyle={{
        backgroundColor: colores.superficie,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 5,
        backgroundColor: colores.linea,
      }}
      handleStyle={{ paddingTop: 10, paddingBottom: 12 }}
      footerComponent={
        footer
          ? (props) => (
              <BottomSheetFooter
                {...props}
                bottomInset={Math.max(insets.bottom, 8)}
              >
                <View style={{ backgroundColor: colores.superficie }}>
                  {footer}
                </View>
              </BottomSheetFooter>
            )
          : undefined
      }
    >
      {children}
    </BottomSheet>
  );
}
