import { useAuthStore } from "@/features/autenticacion/store/authStore";
import { useSplashTargetStore } from "@/shared/store/splashTargetStore";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

// Proporción de la imagen (1508x1320), igual que la escena de la bienvenida
const PROPORCION = 1320 / 1508;

// Tiempos (ms)
const ACERCAMIENTO_MS = 1600; // lo que tarda la moto en llegar
const MINIMO_MS = 1500; // el splash dura como mínimo esto
const MAXIMO_MS = 5000; // y como máximo esto, aunque la sesión no termine de cargar
const ESPERA_DESTINO_MS = 1200; // si la bienvenida no reporta su posición, arranca igual hacia el centro
const ATERRIZAJE_MS = 400; // solo si la posición llega tarde, con la moto ya en camino
const PAUSA_FINAL_MS = 150; // un respiro con la moto ya quieta antes de desvanecer
const DESVANECIDO_MS = 350;

// ===== Recorrido de la moto (EDITA AQUÍ para cambiar la ruta) =====
// Valores en fracciones del tamaño final de la escena, medidos desde su posición final:
// x negativo = izquierda, x positivo = derecha; y positivo = abajo, y negativo = arriba.
const ESCALA_INICIAL = 0.5; // qué tan pequeña ("lejos") empieza
const INICIO_X = -0.4; // punto de partida: esquina de arriba a la izquierda
const INICIO_Y = -0.35;
const CURVA_X = 0; // punto que "jala" la curva (la moto no pasa por él, solo se dobla hacia él)
const CURVA_Y = -0.3;

const GRADIENTE_FONDO = ["#1A4837", "#12392D", "#0F2F26", "#0C211C"] as const;
const UBICACIONES_GRADIENTE = [0, 0.35, 0.7, 1] as const;

export function AnimatedSplashOverlay() {
  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions();
  const anchoBase = anchoPantalla;
  const altoBase = anchoPantalla * PROPORCION;

  const isLoading = useAuthStore((s) => s.isLoading);
  const haySesion = useAuthStore((s) => Boolean(s.user));
  const destino = useSplashTargetStore((s) => s.rect);

  const [minimoCumplido, setMinimoCumplido] = useState(false);
  const [tiempoAgotado, setTiempoAgotado] = useState(false);
  const [esperaAgotada, setEsperaAgotada] = useState(false);
  const [motoLlego, setMotoLlego] = useState(false);
  const [visible, setVisible] = useState(true);
  const acercamientoIniciado = useRef(false);

  // Posición final de la moto. Si la bienvenida no la reporta, se asume centrada.
  const progreso = useSharedValue(0);
  const destinoX = useSharedValue(0);
  const destinoY = useSharedValue((altoPantalla - altoBase) / 2);
  const destinoEscala = useSharedValue(1);

  // Arranque: ocultar el splash nativo y lanzar los temporizadores
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const temporizadorMinimo = setTimeout(() => setMinimoCumplido(true), MINIMO_MS);
    const temporizadorEspera = setTimeout(() => setEsperaAgotada(true), ESPERA_DESTINO_MS);
    // Libera el overlay aunque la sesión nunca termine de cargar
    const temporizadorMaximo = setTimeout(() => setTiempoAgotado(true), MAXIMO_MS);
    return () => {
      clearTimeout(temporizadorMinimo);
      clearTimeout(temporizadorEspera);
      clearTimeout(temporizadorMaximo);
    };
  }, []);

  // La moto arranca recién cuando sabe a dónde va: así hace UN solo recorrido (sin "L")
  const sinBienvenida = !isLoading && haySesion;
  useEffect(() => {
    if (acercamientoIniciado.current) {
      // Caso raro: la posición llegó con la moto ya en camino → se corrige suavemente
      if (destino) {
        const animacion = { duration: ATERRIZAJE_MS, easing: Easing.inOut(Easing.cubic) };
        destinoX.value = withTiming(destino.x, animacion);
        destinoY.value = withTiming(destino.y, animacion);
        destinoEscala.value = withTiming(destino.width / anchoBase, animacion);
      }
      return;
    }
    if (!destino && !sinBienvenida && !esperaAgotada) return;

    acercamientoIniciado.current = true;
    if (destino) {
      destinoX.value = destino.x;
      destinoY.value = destino.y;
      destinoEscala.value = destino.width / anchoBase;
    }
    progreso.value = withTiming(
      1,
      { duration: ACERCAMIENTO_MS, easing: Easing.out(Easing.cubic) },
      (terminado) => {
        "worklet";
        if (terminado) scheduleOnRN(setMotoLlego, true);
      }
    );
  }, [destino, sinBienvenida, esperaAgotada, anchoBase, progreso, destinoX, destinoY, destinoEscala]);

  // Salida: moto en su sitio, tiempo mínimo cumplido y sesión cargada
  const listo = motoLlego && minimoCumplido && (!isLoading || tiempoAgotado);
  useEffect(() => {
    if (!listo) return;
    const temporizador = setTimeout(() => setVisible(false), PAUSA_FINAL_MS);
    return () => clearTimeout(temporizador);
  }, [listo]);

  const estiloMoto = useAnimatedStyle(() => {
    const p = progreso.value;
    const q = 1 - p;
    const s = destinoEscala.value;
    const anchoFinal = anchoBase * s;
    const altoFinal = altoBase * s;
    // Curva de Bézier cuadrática: parte de INICIO, se dobla hacia CURVA y termina en (0, 0)
    const desplazamientoX = (q * q * INICIO_X + 2 * q * p * CURVA_X) * anchoFinal;
    const desplazamientoY = (q * q * INICIO_Y + 2 * q * p * CURVA_Y) * altoFinal;
    const centroX = destinoX.value + anchoFinal / 2 + desplazamientoX;
    const centroY = destinoY.value + altoFinal / 2 + desplazamientoY;
    return {
      opacity: interpolate(p, [0, 0.3], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: centroX - anchoBase / 2 },
        { translateY: centroY - altoBase / 2 },
        { scale: s * (ESCALA_INICIAL + (1 - ESCALA_INICIAL) * p) },
      ],
    };
  });

  if (!visible) return null;

  return (
    <Animated.View style={styles.overlay} exiting={FadeOut.duration(DESVANECIDO_MS)}>
      <LinearGradient
        colors={GRADIENTE_FONDO}
        locations={UBICACIONES_GRADIENTE}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.moto, { width: anchoBase, height: altoBase }, estiloMoto]}>
        <Image
          source={require("@/assets/images/mototaxi-splash.png")}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    // Va antes del <Slot /> en el layout: sin esto, las pantallas lo taparían
    zIndex: 1000,
  },
  moto: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
