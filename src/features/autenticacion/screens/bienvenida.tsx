import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const COLORES = {
  fondoArriba: "#1A4837",
  fondoMedio: "#12392D",
  fondoBajo: "#0F2F26",
  fondoAbajo: "#0C211C",

  crema: "#FAF8F1",
  verdeMarca: "#83D5AA",
  eslogan: "#E8EFE9",
  secundario: "#A8BDB2",
  enlace: "#62D3A0",

  botonIzq: "#83D5AA",
  botonCentro: "#83D5AA",
  botonDer: "#83D5AA",
};

const PROPORCION_ESCENA = 1508 / 1320;
const PROPORCION_PIN = 390 / 336;

const PADDING_LATERAL = 24;

export default function PantallaBienvenida() {
  const { width, height } = useWindowDimensions();

  const [fuentesCargadas, errorFuente] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  if (!fuentesCargadas && !errorFuente) {
    return null;
  }

  const compacta = height < 740;

  const tamanoMarca = Math.min(76, width * 0.195);
  const anchoPin = tamanoMarca * 0.8;
  const altoPin = anchoPin / PROPORCION_PIN;

  const anchoEscena = width * (compacta ? 0.92 : 1);

  return (
    <LinearGradient
      colors={[
        COLORES.fondoArriba,
        COLORES.fondoMedio,
        COLORES.fondoBajo,
        COLORES.fondoAbajo,
      ]}
      locations={[0, 0.35, 0.7, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.fondo}
    >
      <StatusBar style="light" />

      <SafeAreaView style={styles.areaSegura} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={[
            styles.contenido,
            compacta && styles.contenidoCompacto,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          <View style={styles.encabezado}>
            <View
              style={[styles.contenedorMarca, { paddingTop: tamanoMarca * 0.58 }]}
              accessibilityRole="header"
              accessibilityLabel="Altokke"
            >
              <Image
                source={require("@/assets/images/pin-altokke.png")}
                style={{
                  position: "absolute",
                  top: tamanoMarca * 0.2,
                  left: "65%",
                  marginLeft: -anchoPin * 0.385,
                  width: anchoPin,
                  height: altoPin,
                }}
                contentFit="contain"
              />

              <Text
                style={[
                  styles.marca,
                  {
                    fontSize: tamanoMarca,
                    lineHeight: tamanoMarca * 1.1,
                  },
                ]}
              >
                <Text style={styles.alto}>Alto</Text>
                <Text style={styles.kke}>kke</Text>
              </Text>
            </View>

            <Text style={styles.eslogan}>Tu viaje, a un toque.</Text>
          </View>

          <View style={styles.centro}>
            <Image
              source={require("@/assets/images/escena-mototaxi.png")}
              style={{
                width: anchoEscena,
                aspectRatio: PROPORCION_ESCENA,
              }}
              contentFit="contain"
              accessibilityRole="image"
              accessibilityLabel="Mototaxi Altokke recorriendo la ciudad"
            />
          </View>

          <View style={styles.acciones}>
            <Pressable
              onPress={() => router.push("/crear-cuenta")}
              accessibilityRole="button"
              accessibilityLabel="Comenzar"
              style={({ pressed }) => [
                pressed && styles.botonPresionado,
              ]}
            >
              <LinearGradient
                colors={[
                  COLORES.botonIzq,
                  COLORES.botonCentro,
                  COLORES.botonDer,
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.boton}
              >
                <Text style={styles.textoBoton}>Comenzar</Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color="#0C211C"
                  style={styles.flecha}
                />
              </LinearGradient>
            </Pressable>

            <View style={styles.filaLogin}>
              <Text style={styles.pregunta}>¿Ya tienes una cuenta?</Text>

              <Pressable
                onPress={() => router.push("/login")}
                hitSlop={12}
                accessibilityRole="link"
                accessibilityLabel="Iniciar sesión"
              >
                <Text style={styles.enlace}>Inicia sesión</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: COLORES.fondoAbajo,
  },

  areaSegura: {
    flex: 1,
  },

  contenido: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: PADDING_LATERAL,
    justifyContent: "space-between",
  },

  contenidoCompacto: {
    paddingTop: 10,
    paddingBottom: 16,
  },

  encabezado: {
    alignItems: "center",
  },

  contenedorMarca: {
    alignSelf: "center",
  },

  marca: {
    fontFamily: "Outfit_700Bold",
    letterSpacing: -1.5,
    textAlign: "center",
    includeFontPadding: false,
  },

  alto: {
    color: COLORES.crema,
  },

  kke: {
    color: COLORES.verdeMarca,
  },

  eslogan: {
    marginTop: 2,
    fontFamily: "Outfit_400Regular",
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: 0.2,
    textAlign: "center",
    color: COLORES.eslogan,
    includeFontPadding: false,
  },

  centro: {
    flex: 1,
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -PADDING_LATERAL,
  },

  acciones: {
    width: "100%",
    gap: 20,
  },

  botonPresionado: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },

  boton: {
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 20,
  },

  textoBoton: {
    fontFamily: "Outfit_500Medium",
    fontSize: 19,
    color: "#0C211C",
    includeFontPadding: false,
  },

  flecha: {
    position: "absolute",
    right: 20,
  },

  filaLogin: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingBottom: 4,
  },

  pregunta: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: COLORES.secundario,
    includeFontPadding: false,
  },

  enlace: {
    fontFamily: "Outfit_500Medium",
    fontSize: 15,
    color: COLORES.enlace,
    textDecorationLine: "underline",
    includeFontPadding: false,
  },
});