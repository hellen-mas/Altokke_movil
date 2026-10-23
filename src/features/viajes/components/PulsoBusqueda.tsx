import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { IconoMototaxi } from "./IconoMototaxi";

const DURACION_ONDA_MS = 2200;

function Onda({ retraso, color }: { retraso: number; color: string }) {
  const [progreso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.delay(retraso),
        Animated.timing(progreso, {
          toValue: 1,
          duration: DURACION_ONDA_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animacion.start();

    return () => animacion.stop();
  }, [progreso, retraso]);

  return (
    <Animated.View
      style={[
        styles.onda,
        {
          backgroundColor: color,
          opacity: progreso.interpolate({
            inputRange: [0, 1],
            outputRange: [0.45, 0],
          }),
          transform: [
            {
              scale: progreso.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.6],
              }),
            },
          ],
        },
      ]}
    />
  );
}

/** Círculo con mototaxi y ondas que se expanden mientras se busca conductor */
export function PulsoBusqueda() {
  const { colores } = useAltokkeTheme();

  return (
    <View style={styles.contenedor}>
      <Onda retraso={0} color={colores.primario} />
      <Onda retraso={DURACION_ONDA_MS / 2} color={colores.primario} />

      <View
        style={[
          styles.centro,
          {
            backgroundColor: colores.primario,
            borderColor: colores.superficie,
          },
        ]}
      >
        <IconoMototaxi size={34} color={colores.textoBoton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: 150,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },

  onda: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  centro: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
});
