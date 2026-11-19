import { useHaptics } from "@/shared/hooks/useHaptics";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const TELEFONO_CENTRAL_BAGUA = "+51941234567";
const WHATSAPP_CENTRAL_BAGUA = "51941234567";

/**
 * Componente de asistencia para adultos mayores (65+) o usuarios que prefieren
 * solicitar su mototaxi por llamada telefónica verbal o WhatsApp tradicional en Bagua.
 */
export function BotonCentralAsistencia() {
  const { colores, esOscuro } = useAltokkeTheme();
  const { impactoLigero } = useHaptics();

  const handleLlamarCentral = () => {
    impactoLigero();
    Alert.alert(
      "Central de Mototaxis Altokke",
      "¿Deseas llamar directamente a la central de mototaxis de Bagua?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Llamar por Teléfono",
          onPress: () => {
            Linking.openURL(`tel:${TELEFONO_CENTRAL_BAGUA}`).catch((err) => {
              console.warn("No se pudo iniciar llamada telefónica:", err);
            });
          },
        },
        {
          text: "Pedir por WhatsApp",
          onPress: () => {
            const url = `whatsapp://send?phone=${WHATSAPP_CENTRAL_BAGUA}&text=${encodeURIComponent(
              "Hola Central Altokke, deseo solicitar una mototaxi.",
            )}`;
            Linking.openURL(url).catch((err) => {
              console.warn("No se pudo abrir WhatsApp:", err);
            });
          },
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={handleLlamarCentral}
      style={({ pressed }) => [
        styles.boton,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.primario,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Asistencia Telefónica: llamar a la Central de Mototaxis de Bagua"
      accessibilityHint="Permite pedir una mototaxi mediante llamada telefónica o WhatsApp"
    >
      <View
        style={[styles.iconoCirculo, { backgroundColor: colores.primario }]}
      >
        <Ionicons name="call" size={24} color="#0C211C" />
      </View>
      <View style={styles.textos}>
        <Text
          maxFontSizeMultiplier={1.35}
          style={[styles.titulo, { color: colores.texto }]}
        >
          ¿Ayuda para pedir tu moto?
        </Text>
        <Text
          maxFontSizeMultiplier={1.35}
          style={[styles.descripcion, { color: colores.secundario }]}
        >
          Llama o escribe a nuestra Central
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colores.secundario} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64, // Touch target ergonómico accesible
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    marginVertical: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconoCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textos: {
    flex: 1,
    justifyContent: "center",
  },
  titulo: {
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
  },
  descripcion: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
});
