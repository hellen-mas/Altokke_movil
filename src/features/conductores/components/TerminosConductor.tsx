import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

interface TerminosConductorProps {
  aceptado: boolean;
  onCambiar: (valor: boolean) => void;
}

export function TerminosConductor({ aceptado, onCambiar }: TerminosConductorProps) {
  const { colores } = useAltokkeTheme();

  const handleTerms = () => {
    Alert.alert(
      "Términos y condiciones del conductor",
      "1. Licencia de Conducir Clase B-IIc vigente y SOAT urbano obligatorio.\n" +
        "2. Cumplimiento estricto de normas de tránsito y ordenanzas municipales de Bagua.\n" +
        "3. Respeto de tarifas oficiales del servicio y prohibición de cobros indebidos.\n" +
        "4. Cero tolerancia al consumo de alcohol o sustancias durante la jornada.\n" +
        "5. El incumplimiento causará la baja inmediata e irrevocable de la plataforma.",
      [{ text: "Entendido" }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Política de privacidad (Ley 29733)",
      "Altokke recopila tus datos personales, ubicación satelital y documentos oficiales " +
        "conforme a la Ley N° 29733 para validar tu idoneidad como conductor " +
        "y garantizar la seguridad integral de los pasajeros.",
      [{ text: "Entendido" }]
    );
  };

  return (
    <View
      style={[
        styles.contenedor,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.linea,
        },
      ]}
    >
      <Pressable
        style={styles.fila}
        onPress={() => onCambiar(!aceptado)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceptado }}
        accessibilityLabel="He leído y acepto los términos y condiciones de conductor y la política de privacidad"
      >
        <Ionicons
          name={aceptado ? "checkbox" : "square-outline"}
          size={24}
          color={aceptado ? colores.exitoTexto : colores.secundario}
        />
        <Text style={[styles.textoCheckbox, { color: colores.texto }]}>
          He leído y acepto los términos y condiciones de conductor y la política de privacidad.
        </Text>
      </Pressable>

      <View style={styles.enlaces}>
        <Pressable onPress={handleTerms} accessibilityRole="link" hitSlop={6}>
          <Text style={[styles.enlace, { color: colores.exitoTexto }]}>
            Leer términos y condiciones
          </Text>
        </Pressable>

        <Text style={[styles.separador, { color: colores.secundario }]}>·</Text>

        <Pressable onPress={handlePrivacy} accessibilityRole="link" hitSlop={6}>
          <Text style={[styles.enlace, { color: colores.exitoTexto }]}>
            Política de privacidad
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 16,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: 44,
  },
  textoCheckbox: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  enlaces: {
    marginLeft: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  separador: {
    fontSize: 14,
    fontWeight: "600",
  },
  enlace: {
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default TerminosConductor;
