import {
  BotonPrincipal,
  EncabezadoLogo,
  EncabezadoPagina,
  PiePaginaAutenticacion,
} from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PantallaBienvenida() {
  const [modalInfoVisible, setModalInfoVisible] = useState(false);

  return (
    <LinearGradient
      colors={["#05150E", "#0A2217", "#06150E", "#040D08"]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
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
            <View style={styles.barraSuperior}>
              <EncabezadoLogo
                sinMargenSuperior
                estilo={styles.encabezadoLogoAjuste}
              />

              <Pressable
                onPress={() => setModalInfoVisible(true)}
                style={({ pressed }) => [
                  styles.botonConfiguracion,
                  pressed && styles.botonConfiguracionPresionado,
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Información del servicio"
                accessibilityHint="Muestra información del servicio y soporte"
              >
                <Ionicons name="settings-sharp" size={24} color="#E2ECE6" />
              </Pressable>
            </View>

            <View style={styles.headerContainer}>
              <EncabezadoPagina
                titulo={"Tu mototaxi,\n"}
                tituloDestacado="cuando lo necesites."
                descripcion="Pide tu viaje de forma rápida, segura y sencilla."
              />
            </View>
          </View>


          <View style={styles.imageContainer}>
            <Image
              source={require("@/assets/images/img-central.png")}
              style={styles.ilustracion}
              contentFit="contain"
              transition={300}
              accessibilityRole="image"
              accessibilityLabel="Ilustración de mototaxi"
            />
          </View>

          <View style={styles.bottomSection}>
            <BotonPrincipal
              titulo="Continuar"
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

      {/* Modal de Configuración e Información */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalInfoVisible}
        onRequestClose={() => setModalInfoVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalInfoVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar ventana tocando afuera"
          />

          <View style={styles.tarjetaModal} accessibilityViewIsModal={true}>
            <View style={styles.cabeceraModal}>
              <View style={styles.iconoTituloModal}>
                <Ionicons name="information-circle-outline" size={26} color="#2ECE79" />
                <Text style={styles.tituloModal}>Información</Text>
              </View>

              <Pressable
                onPress={() => setModalInfoVisible(false)}
                style={({ pressed }) => [
                  styles.botonCerrarModal,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar información"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.contenidoModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.textoModal}>
                Nuestra plataforma conecta a pasajeros y conductores de mototaxis de manera rápida, confiable y segura.
              </Text>

              <View style={styles.cajaInformativaModal}>
                <Ionicons name="phone-portrait-outline" size={22} color="#2ECE79" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tituloCajaModal}>Adaptabilidad del sistema</Text>
                  <Text style={styles.descripcionCajaModal}>
                    Esta aplicación se adapta automáticamente al tamaño de letra y
                    ajustes de accesibilidad configurados en tu celular.
                  </Text>
                </View>
              </View>

              <View style={styles.filaVersion}>
                <Text style={styles.etiquetaVersion}>Versión</Text>
                <Text style={styles.valorVersion}>1.0.0</Text>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setModalInfoVisible(false)}
              style={({ pressed }) => [
                styles.botonAceptarModal,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Entendido, cerrar ventana"
            >
              <Text style={styles.textoBotonAceptarModal}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 24,
    paddingTop: 8,
  },
  topSection: {
    gap: 6,
  },
  barraSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  encabezadoLogoAjuste: {
    width: "auto",
    marginBottom: 0,
    marginTop: 8,
  },
  botonConfiguracion: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  botonConfiguracionPresionado: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  headerContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  imageContainer: {
    flex: 1,
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 14,
  },
  ilustracion: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
    transform: [{ scale: 1.18 }],
  },
  bottomSection: {
    gap: 20,
    paddingTop: 4,
  },
  footerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  tarjetaModal: {
    backgroundColor: "#0D1E16",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "#203B2C",
    maxHeight: "80%",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  cabeceraModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  iconoTituloModal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tituloModal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  botonCerrarModal: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  contenidoModalScroll: {
    gap: 14,
    paddingVertical: 4,
  },
  textoModal: {
    fontSize: 16,
    color: "#D8E5DF",
    lineHeight: 24,
  },
  cajaInformativaModal: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(46, 206, 121, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(46, 206, 121, 0.25)",
    borderRadius: 16,
    padding: 14,
  },
  tituloCajaModal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2ECE79",
    marginBottom: 3,
  },
  descripcionCajaModal: {
    fontSize: 14,
    color: "#D8E5DF",
    lineHeight: 20,
  },
  filaVersion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  etiquetaVersion: {
    fontSize: 14,
    color: "#9DAAA3",
  },
  valorVersion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  botonAceptarModal: {
    minHeight: 54,
    backgroundColor: "#2ECE79",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  textoBotonAceptarModal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#051A10",
  },
});
