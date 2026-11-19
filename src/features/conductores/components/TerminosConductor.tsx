import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

interface TerminosConductorProps {
  aceptado: boolean;
  onCambiar: (valor: boolean) => void;
}

export function TerminosConductor({
  aceptado,
  onCambiar,
}: TerminosConductorProps) {
  const { colores } = useAltokkeTheme();
  const [terminosAceptados, setTerminosAceptados] = useState(aceptado);
  const [privacidadAceptada, setPrivacidadAceptada] = useState(aceptado);
  const terminosMarcados = aceptado || terminosAceptados;
  const privacidadMarcada = aceptado || privacidadAceptada;

  const actualizarTerminos = (valor: boolean) => {
    setTerminosAceptados(valor);
    onCambiar(valor && privacidadAceptada);
  };

  const actualizarPrivacidad = (valor: boolean) => {
    setPrivacidadAceptada(valor);
    onCambiar(terminosAceptados && valor);
  };

  const handleTerms = () => {
    Alert.alert(
      "Términos y condiciones del conductor",
      "1. LICENCIA DE CONDUCIR\n\n" +
        "El conductor debe contar con una licencia de conducir Clase B, categoría II-C (B-IIc), vigente y correspondiente al vehículo menor utilizado para prestar el servicio de mototaxi.\n\n" +
        "2. DOCUMENTACIÓN Y SEGURO\n\n" +
        "El conductor debe mantener vigente el SOAT o CAT emitido por una AFOCAT autorizada, junto a la tarjeta de propiedad y revisión técnica obligatoria.\n\n" +
        "3. SEGURIDAD Y TRATO AL PASAJERO\n\n" +
        "El conductor debe respetar las normas de tránsito, límites de velocidad y capacidad máxima permitida (hasta 3 pasajeros según D.S. 055-2010-MTC).\n\n" +
        "4. RESPETO DE TARIFAS Y TRANSPARENCIA\n\n" +
        "Se debe respetar la tarifa informada por la aplicación, sin cobros indebidos no acordados.",
      [{ text: "Entendido" }],
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Protección de datos personales (Ley N° 29733)",
      "ALTOKKE realiza el tratamiento de datos personales conforme a la Ley N° 29733.\n\n" +
        "Finalidad: Verificación de identidad ante RENIEC, geolocalización en tiempo real durante carreras activas, trazabilidad de seguridad y atención de emergencias.\n\n" +
        "Tus datos de ubicación solo se transmiten durante la prestación del servicio. Tienes derecho de acceso, rectificación, cancelación y oposición (ARCO).",
      [{ text: "Entendido" }],
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
      {/* Checkbox 1: Términos y Condiciones */}
      <Pressable
        style={styles.fila}
        onPress={() => actualizarTerminos(!terminosMarcados)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: terminosMarcados }}
        accessibilityLabel="He leído y acepto los términos y condiciones de conductor"
      >
        <Ionicons
          name={terminosMarcados ? "checkbox" : "square-outline"}
          size={22}
          color={terminosMarcados ? colores.exitoTexto : colores.secundario}
        />
        <Text style={[styles.textoCheckbox, { color: colores.texto }]}>
          He leído y acepto los{" "}
          <Text
            onPress={handleTerms}
            style={[styles.enlaceInline, { color: colores.exitoTexto }]}
          >
            términos y condiciones
          </Text>{" "}
          del servicio de conductor.
        </Text>
      </Pressable>

      {/* Checkbox 2: Privacidad y LPDP Ley 29733 */}
      <Pressable
        style={styles.fila}
        onPress={() => actualizarPrivacidad(!privacidadMarcada)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: privacidadMarcada }}
        accessibilityLabel="Autorizo el tratamiento de mis datos personales y geolocalización"
      >
        <Ionicons
          name={privacidadMarcada ? "checkbox" : "square-outline"}
          size={22}
          color={privacidadMarcada ? colores.exitoTexto : colores.secundario}
        />
        <Text style={[styles.textoCheckbox, { color: colores.texto }]}>
          Autorizo el tratamiento de mis datos personales y geolocalización
          según la{" "}
          <Text
            onPress={handlePrivacy}
            style={[styles.enlaceInline, { color: colores.exitoTexto }]}
          >
            política de privacidad
          </Text>{" "}
          (Ley N° 29733).
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 16,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 40,
  },
  textoCheckbox: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  enlaceInline: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default TerminosConductor;
