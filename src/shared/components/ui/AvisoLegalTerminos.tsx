import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  POLITICA_PRIVACIDAD,
  TERMINOS_SERVICIO,
} from "@/shared/constants/textosLegales";
import { ModalTextoLegal } from "./ModalTextoLegal";

export function AvisoLegalTerminos() {
  const { colores } = useAltokkeTheme();
  const [visible, setVisible] = useState(false);
  // tipo se conserva al cerrar para que el texto no cambie durante el fade
  const [tipo, setTipo] = useState<"terminos" | "privacidad">("terminos");

  const abrirModal = (nuevoTipo: "terminos" | "privacidad") => {
    setTipo(nuevoTipo);
    setVisible(true);
  };

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.textoLegal, { color: colores.secundario }]}>
        Al continuar, aceptas nuestros{" "}
        <Text
          onPress={() => abrirModal("terminos")}
          accessibilityRole="link"
          style={[styles.enlaceLegal, { color: colores.exitoTexto }]}
        >
          Términos de servicio
        </Text>{" "}
        y{" "}
        <Text
          onPress={() => abrirModal("privacidad")}
          accessibilityRole="link"
          style={[styles.enlaceLegal, { color: colores.exitoTexto }]}
        >
          Política de privacidad
        </Text>
        .
      </Text>

      <ModalTextoLegal
        visible={visible}
        texto={tipo === "terminos" ? TERMINOS_SERVICIO : POLITICA_PRIVACIDAD}
        onCerrar={() => setVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    paddingHorizontal: 8,
    marginTop: 4,
  },
  textoLegal: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  enlaceLegal: {
    fontWeight: "600",
  },
});

export default AvisoLegalTerminos;
