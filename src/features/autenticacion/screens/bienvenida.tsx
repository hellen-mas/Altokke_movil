import { EscenaMototaxi } from "@/features/autenticacion/components/EscenaMototaxi";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GRADIENTE_FONDO = ["#1A4837", "#12392D", "#0F2F26", "#0C211C"] as const;
const COLOR_BOTON = ["#83D5AA", "#83D5AA", "#83D5AA"] as const;

export default function PantallaBienvenida() {
  const { width } = useWindowDimensions();
  const tamanoMarca = Math.min(76, width * 0.195);
  const anchoPin = tamanoMarca * 0.8;
  const altoPin = anchoPin / (390 / 336);

  return (
    <LinearGradient colors={GRADIENTE_FONDO} locations={[0, 0.35, 0.7, 1]} style={styles.fondo}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.areaSegura} edges={["top", "bottom"]}>
        <View style={styles.contenido}>
          <View style={styles.encabezado}>
            <View style={[styles.contenedorMarca, { paddingTop: tamanoMarca * 0.58 }]}>
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
              <Text style={[styles.marca, { fontSize: tamanoMarca, lineHeight: tamanoMarca * 1.1 }]}>
                <Text style={{ color: "#FAF8F1" }}>Alto</Text>
                <Text style={{ color: "#83D5AA" }}>kke</Text>
              </Text>
            </View>
            <Text style={styles.eslogan}>Tu viaje, a un toque.</Text>
          </View>

          <View style={styles.centro}>
            <EscenaMototaxi />
          </View>

          <View style={styles.acciones}>
            <Pressable
              onPress={() => router.push("/crear-cuenta")}
              accessibilityRole="button"
              accessibilityLabel="Comenzar"
              style={({ pressed }) => [pressed && styles.botonPresionado]}
            >
              <LinearGradient colors={COLOR_BOTON} style={styles.boton}>
                <Text style={styles.textoBoton}>Comenzar</Text>
                <Ionicons name="arrow-forward" size={19} color="#0C211C" style={styles.flecha} />
              </LinearGradient>
            </Pressable>

            <View style={styles.filaLogin}>
              <Text style={styles.pregunta}>¿Ya tienes una cuenta?</Text>
              <Pressable onPress={() => router.push("/login")} hitSlop={12} accessibilityRole="link">
                <Text style={styles.enlace}>Inicia sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#0C211C" },
  areaSegura: { flex: 1 },
  contenido: { flex: 1, paddingVertical: 24, paddingHorizontal: 24, justifyContent: "space-between" },
  encabezado: { alignItems: "center" },
  contenedorMarca: { alignSelf: "center" },
  marca: { fontFamily: "Outfit_700Bold", letterSpacing: -1.5, textAlign: "center", includeFontPadding: false },
  eslogan: { marginTop: 2, fontFamily: "Outfit_400Regular", fontSize: 21, lineHeight: 28, color: "#E8EFE9", textAlign: "center" },
  centro: { flex: 1, minHeight: 200, alignItems: "center", justifyContent: "center" },
  acciones: { width: "100%", gap: 20 },
  botonPresionado: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  boton: { height: 50, borderRadius: 30, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 20 },
  textoBoton: { fontFamily: "Outfit_500Medium", fontSize: 19, color: "#0C211C" },
  flecha: { position: "absolute", right: 20 },
  filaLogin: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingBottom: 4 },
  pregunta: { fontFamily: "Outfit_400Regular", fontSize: 15, color: "#A8BDB2" },
  enlace: { fontFamily: "Outfit_500Medium", fontSize: 15, color: "#62D3A0", textDecorationLine: "underline" },
});