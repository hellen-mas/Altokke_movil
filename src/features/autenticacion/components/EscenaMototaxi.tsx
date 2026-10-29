import { useSplashTargetStore } from "@/shared/store/splashTargetStore";
import { Image } from "expo-image";
import { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";

/**
 * Escena de la mototaxi de la bienvenida. Además de mostrarse, mide dónde quedó
 * en pantalla y se lo avisa al splash para que la moto aterrice justo ahí.
 */
export function EscenaMototaxi() {
  const ref = useRef<View>(null);
  const setRect = useSplashTargetStore((s) => s.setRect);

  const medir = useCallback(() => {
    // Esperamos un frame para que la posición ya sea la definitiva
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) setRect({ x, y, width, height });
      });
    });
  }, [setRect]);

  return (
    <View ref={ref} collapsable={false} onLayout={medir} style={styles.marco}>
      <Image
        source={require("@/assets/images/escena-mototaxi.png")}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        accessibilityRole="image"
        accessibilityLabel="Mototaxi Altokke recorriendo la ciudad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  marco: { width: "100%", aspectRatio: 1508 / 1320 },
});
