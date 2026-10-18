import {
  BotonPrincipal,
  EncabezadoLogo,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { paletaColores } from "@/paletaColores";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PantallaBienvenida() {
  return (
    <LinearGradient
      colors={["#0E1C15", paletaColores.fondo]}
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
            <EncabezadoLogo
              sinMargenSuperior
              estilo={styles.encabezadoLogoAjuste}
            />

            <View style={styles.headerContainer}>
              <EncabezadoPagina
                titulo="Tu mototaxi en minutos"
                descripcion="Pide tu viaje al instante o genera ingresos conduciendo."
              />
            </View>
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

            <View style={styles.footerWrap}>
              <PiePaginaAutenticacion
                textoPregunta="¿Ya tienes cuenta?"
                ruta="/login"
                textoEnlace="Iniciar sesión"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondo,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingTop: 8,
  },
  topSection: {
    gap: 4,
  },
  encabezadoLogoAjuste: {
    width: "auto",
    marginBottom: 0,
    marginTop: 4,
  },
  headerContainer: {
    marginTop: 2,
    marginBottom: 8,
  },
  imageContainer: {
    flex: 1,
    minHeight: 220,
    maxHeight: 340,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  ilustracion: {
    width: "90%",
    height: "100%",
    alignSelf: "center",
  },
  bottomSection: {
    gap: 14,
    paddingTop: 4,
  },
  footerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});

