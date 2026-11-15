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
      "1. LICENCIA DE CONDUCIR\n\n" +
        "El conductor debe contar con una licencia de conducir Clase B, categoría II-C (B-IIc), vigente y correspondiente al vehículo menor utilizado para prestar el servicio de mototaxi.\n\n" +

        "2. DOCUMENTACIÓN Y SEGURO\n\n" +
        "El conductor debe mantener vigente el SOAT o, cuando corresponda conforme a la normativa aplicable, el CAT emitido por una AFOCAT autorizada. También debe conservar los documentos y autorizaciones exigibles para la circulación y prestación del servicio.\n\n" +

        "3. SEGURIDAD Y TRATO AL PASAJERO\n\n" +
        "El conductor debe respetar las normas de tránsito, los límites de capacidad del vehículo y las condiciones de seguridad. Asimismo, debe brindar un trato digno, respetuoso y sin discriminación a todos los pasajeros. Está prohibido conducir bajo los efectos del alcohol o sustancias que afecten sus capacidades.\n\n" +

        "4. RESPETO DE TARIFAS\n\n" +
        "El conductor debe respetar la tarifa informada y aceptada para el servicio, así como las disposiciones tarifarias municipales vigentes que resulten aplicables en Bagua. No debe exigir cobros adicionales que no hayan sido informados y aceptados.\n\n" +

        "5. CUMPLIMIENTO DE LAS CONDICIONES DEL SERVICIO\n\n" +
        "El conductor debe proporcionar información veraz, mantener actualizados sus documentos y utilizar la plataforma de acuerdo con las condiciones del servicio. Los incumplimientos podrán dar lugar a una revisión y a las medidas correspondientes según su gravedad y las políticas aplicables.",
      [{ text: "Entendido" }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Protección de datos personales",
      "ALTOKKE realiza el tratamiento de datos personales conforme a la Ley N.º 29733, Ley de Protección de Datos Personales, y su Reglamento vigente.\n\n" +

        "Durante el registro y utilización de la aplicación se pueden tratar datos de identificación, contacto, fotografías, documentos del conductor, información del vehículo, ubicación y datos relacionados con los viajes.\n\n" +

        "Esta información se utiliza para gestionar el registro, verificar los requisitos del conductor, facilitar la prestación del servicio, contribuir a la seguridad de los usuarios y atender incidencias.\n\n" +

        "Los datos necesarios para realizar un viaje pueden compartirse con el pasajero correspondiente. También podrán comunicarse a las autoridades competentes cuando exista una obligación legal.\n\n" +

        "El titular puede ejercer los derechos que le reconoce la normativa de protección de datos personales, conforme al procedimiento establecido en la Política de Privacidad de ALTOKKE.",
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
