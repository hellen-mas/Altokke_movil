import {
  BotonPrincipal,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: ALTO_PANTALLA } = Dimensions.get("window");

export default function PantallaBienvenida() {
  return (
    <LinearGradient
      colors={["#1d5538ff", paletaColores.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.7 }}
      style={styles.pantalla}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            <EncabezadoPagina
              titulo="Tu mototaxi en "
              tituloDestacado="minutos"
              descripcion="Pide tu viaje al instante o genera ingresos conduciendo."
            />
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={require("@/assets/images/imagen-central-v2.png")}
              style={styles.ilustracion}
              contentFit="contain"
              transition={250}
              accessibilityRole="image"
              accessibilityLabel="Ilustración de mototaxi Altokke"
            />
          </View>

          <View style={styles.bottomSection}>
            <BotonPrincipal
              titulo="Empezar ahora"
              onPress={() => router.push("/crear-cuenta")}
            />
            <PiePaginaAutenticacion
              textoPregunta="¿Ya tienes cuenta?"
              ruta="/login"
              textoEnlace="Iniciar sesión"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 24,
    paddingTop: 12,
  },
  topSection: {
    gap: 12,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginVertical: 8,
  },
  ilustracion: {
    width: "120%",
    height: Math.min(Math.max(ALTO_PANTALLA * 0.46, 342), 418),
    alignSelf: "center",
  },
  bottomSection: {
    gap: 16,
    paddingTop: 8,
  },
});
