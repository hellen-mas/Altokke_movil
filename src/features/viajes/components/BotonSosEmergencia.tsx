import { useHaptics } from "@/shared/hooks/useHaptics";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface BotonSosEmergenciaProps {
  viajeId?: string;
  coordenadasActuales?: { lat: number; lng: number } | null;
}

/**
 * Botón de Auxilio y Pánico SOS para el viaje en curso.
 * Exige pulsación sostenida (Long Press) para evitar falsos toques accidentales
 * en la mototaxi por el terreno irregular de Bagua.
 */
export function BotonSosEmergencia({
  viajeId,
  coordenadasActuales,
}: BotonSosEmergenciaProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [presionando, setPresionando] = useState(false);
  const { colores, esOscuro } = useAltokkeTheme();
  const { impactoLigero, alarmaEmergenciaSos } = useHaptics();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iniciarPulsacion = () => {
    setPresionando(true);
    impactoLigero();
    timerRef.current = setTimeout(() => {
      alarmaEmergenciaSos();
      setPresionando(false);
      setModalVisible(true);
    }, 2000); // 2 segundos continuos requeridos
  };

  const cancelarPulsacion = () => {
    setPresionando(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const llamarPolicia = () => {
    // Central PNP Bagua
    Linking.openURL("tel:105").catch((err) => {
      console.warn("No se pudo iniciar la llamada:", err);
      Alert.alert(
        "Emergencia",
        "Llama directamente al 105 (Policía Nacional del Perú).",
      );
    });
  };

  const llamarSamu = () => {
    // SAMU Amazonas
    Linking.openURL("tel:106").catch((err) => {
      console.warn("No se pudo iniciar la llamada:", err);
      Alert.alert(
        "Emergencia",
        "Llama directamente al 106 (SAMU Emergencias Médicas).",
      );
    });
  };

  const compartirUbicacionWhatsapp = () => {
    let mensaje = "¡ALERTA DE EMERGENCIA ALTOKKE! Necesito asistencia urgente.";
    if (viajeId) {
      mensaje += ` Viaje ID: ${viajeId}.`;
    }
    if (coordenadasActuales) {
      mensaje += ` Mi ubicación en vivo: https://maps.google.com/?q=${coordenadasActuales.lat},${coordenadasActuales.lng}`;
    }
    const url = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(url).catch((err) => {
      console.warn("No se pudo abrir WhatsApp:", err);
      Alert.alert("Compartir auxilio", mensaje);
    });
  };

  return (
    <>
      <Pressable
        onPressIn={iniciarPulsacion}
        onPressOut={cancelarPulsacion}
        style={({ pressed }) => [
          styles.botonFlotante,
          {
            backgroundColor: presionando ? "#8B0000" : "#B42323",
            transform: [{ scale: pressed || presionando ? 0.94 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Botón de emergencia SOS. Mantén presionado por dos segundos para activar."
      >
        <Ionicons name="warning" size={20} color="#FFFFFF" />
        <Text style={styles.textoBotonSos}>
          {presionando ? "¡SUSTÉN!" : "SOS"}
        </Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.fondoModal}>
          <View
            style={[
              styles.contenedorModal,
              { backgroundColor: colores.superficie },
            ]}
          >
            <View style={styles.cabeceraAlerta}>
              <View style={styles.iconoAlertaContainer}>
                <Ionicons name="warning" size={36} color="#B42323" />
              </View>
              <Text style={[styles.tituloModal, { color: colores.texto }]}>
                Centro de Emergencia Altokke
              </Text>
              <Text
                style={[styles.subtituloModal, { color: colores.secundario }]}
              >
                Servicio de asistencia inmediata. Tu seguridad es nuestra
                prioridad.
              </Text>
            </View>

            <View style={styles.opcionesLista}>
              <Pressable
                onPress={llamarPolicia}
                style={[styles.botonOpcion, { borderColor: colores.linea }]}
              >
                <View
                  style={[styles.iconoOpcion, { backgroundColor: "#EBF3FB" }]}
                >
                  <Ionicons name="call" size={20} color="#0B57D0" />
                </View>
                <View style={styles.textosOpcion}>
                  <Text style={[styles.nombreOpcion, { color: colores.texto }]}>
                    Policía Nacional del Perú (105)
                  </Text>
                  <Text
                    style={[styles.descOpcion, { color: colores.secundario }]}
                  >
                    Comisaría Sectorial de Bagua
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={llamarSamu}
                style={[styles.botonOpcion, { borderColor: colores.linea }]}
              >
                <View
                  style={[styles.iconoOpcion, { backgroundColor: "#FCEBEB" }]}
                >
                  <Ionicons name="medkit" size={20} color="#B42323" />
                </View>
                <View style={styles.textosOpcion}>
                  <Text style={[styles.nombreOpcion, { color: colores.texto }]}>
                    SAMU Ambulancia (106)
                  </Text>
                  <Text
                    style={[styles.descOpcion, { color: colores.secundario }]}
                  >
                    Atención médica de urgencia
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={compartirUbicacionWhatsapp}
                style={[styles.botonOpcion, { borderColor: colores.linea }]}
              >
                <View
                  style={[styles.iconoOpcion, { backgroundColor: "#E6F4EA" }]}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#137333" />
                </View>
                <View style={styles.textosOpcion}>
                  <Text style={[styles.nombreOpcion, { color: colores.texto }]}>
                    Compartir auxilio por WhatsApp
                  </Text>
                  <Text
                    style={[styles.descOpcion, { color: colores.secundario }]}
                  >
                    Envía enlace GPS en vivo a contactos
                  </Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setModalVisible(false)}
              style={[styles.botonCerrar, { backgroundColor: colores.campo }]}
            >
              <Text style={[styles.textoCerrar, { color: colores.texto }]}>
                Cerrar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  botonFlotante: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B42323",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  textoBotonSos: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  contenedorModal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  cabeceraAlerta: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconoAlertaContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FCEBEB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tituloModal: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  subtituloModal: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  opcionesLista: {
    gap: 10,
    marginBottom: 16,
  },
  botonOpcion: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconoOpcion: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textosOpcion: {
    flex: 1,
  },
  nombreOpcion: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
  },
  descOpcion: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  botonCerrar: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textoCerrar: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
  },
});
