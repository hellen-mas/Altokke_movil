import { EscenaMototaxi } from "@/features/autenticacion/components/EscenaMototaxi";
import { PiePaginaAutenticacion } from "@/shared/components/ui/PiePaginaAutenticacion";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GRADIENTE_FONDO = ["#1A4837", "#12392D", "#0F2F26", "#0C211C"] as const;

export default function PantallaBienvenida() {
  const { colores } = useAltokkeTheme();
  const { width } = useWindowDimensions();
  const tamanoMarca = Math.min(76, width * 0.195);
  const anchoPin = tamanoMarca * 0.8;
  const altoPin = anchoPin / (390 / 336);

  return (
    <LinearGradient
      colors={GRADIENTE_FONDO}
      locations={[0, 0.35, 0.7, 1]}
      style={[styles.fondo, { backgroundColor: colores.fondo }]}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.areaSegura} edges={["top", "bottom"]}>
        <View style={styles.contenido}>
          <View style={styles.encabezado}>
            <View
              style={[
                styles.contenedorMarca,
                { paddingTop: tamanoMarca * 0.58 },
              ]}
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
                  { fontSize: tamanoMarca, lineHeight: tamanoMarca * 1.1 },
                ]}
              >
                <Text style={{ color: "#FAF8F1" }}>Alto</Text>
                <Text style={{ color: colores.exitoTexto }}>kke</Text>
              </Text>
            </View>
            <Text style={[styles.eslogan, { color: colores.texto }]}>
              Tu viaje, a un toque.
            </Text>
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
              <View
                style={[
                  styles.boton,
                  { backgroundColor: colores.primario },
                ]}
              >
                <Text
                  style={[
                    styles.textoBoton,
                    { color: colores.textoBoton },
                  ]}
                >
                  Comenzar
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={colores.textoBoton}
                  style={styles.flecha}
                />
              </View>
            </Pressable>

            <PiePaginaAutenticacion
              textoPregunta="¿Ya tienes una cuenta?"
              textoEnlace="Inicia sesión"
              ruta="/login"
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1 },
  areaSegura: { flex: 1 },
  contenido: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  encabezado: { alignItems: "center" },
  contenedorMarca: { alignSelf: "center" },
  marca: {
    fontFamily: "Outfit_700Bold",
    letterSpacing: -1.5,
    textAlign: "center",
    includeFontPadding: false,
  },
  eslogan: {
    marginTop: 2,
    fontFamily: "Outfit_400Regular",
    fontSize: 21,
    lineHeight: 28,
    textAlign: "center",
  },
  centro: {
    flex: 1,
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  acciones: { width: "100%", gap: 16 },
  botonPresionado: { opacity: 0.9, transform: [{ scale: 0.985 }] },
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
  },
  flecha: { position: "absolute", right: 20 },
});
