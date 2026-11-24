import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import type { TextoLegal } from "@/shared/constants/textosLegales";

export interface PropsModalTextoLegal {
  visible: boolean;
  texto: TextoLegal;
  onCerrar: () => void;
}

export function ModalTextoLegal({ visible, texto, onCerrar }: PropsModalTextoLegal) {
  const { colores } = useAltokkeTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={styles.modalFondo}>
        {/* maxHeight deja que el ScrollView se encoja y haga scroll con texto largo */}
        <View
          style={[
            styles.modalCaja,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <View style={styles.modalCabecera}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>
              {texto.titulo}
            </Text>

            <Pressable
              onPress={onCerrar}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={22} color={colores.secundario} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContenido}
            showsVerticalScrollIndicator
          >
            {texto.secciones.map((seccion, indice) => (
              <View key={indice} style={styles.seccion}>
                {seccion.subtitulo ? (
                  <Text style={[styles.subtitulo, { color: colores.texto }]}>
                    {seccion.subtitulo}
                  </Text>
                ) : null}
                <Text style={[styles.contenido, { color: colores.secundario }]}>
                  {seccion.contenido}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={onCerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            style={({ pressed }) => [
              styles.botonCerrar,
              {
                backgroundColor: pressed
                  ? colores.primarioPresionado
                  : colores.primario,
              },
            ]}
          >
            <Text style={[styles.textoCerrar, { color: colores.textoBoton }]}>
              Cerrar
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCaja: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    alignSelf: "center",
    padding: 20,
    borderWidth: 1,
    borderRadius: 22,
    gap: 15,
  },
  modalCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitulo: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContenido: {
    gap: 18,
  },
  seccion: {
    gap: 8,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: "700",
  },
  contenido: {
    fontSize: 13,
    lineHeight: 20,
  },
  botonCerrar: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  textoCerrar: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default ModalTextoLegal;
