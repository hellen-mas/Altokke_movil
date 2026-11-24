import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export interface ModalDivulgacionUbicacionProps {
  visible: boolean;
  onAceptar: () => void;
  onRechazar: () => void;
  esSegundoPlano?: boolean;
}

/**
 * Modal de Divulgación Prominente (Prominent Disclosure) para permisos de ubicación.
 * Cumple con las políticas de Google Play Store y directrices de App Store:
 * explica de forma clara y previa la recopilación y uso de datos de geolocalización
 * para cálculo de rutas, asignación de mototaxis y rastreo en tiempo real durante viajes activos.
 */
export function ModalDivulgacionUbicacion({
  visible,
  onAceptar,
  onRechazar,
  esSegundoPlano = false,
}: ModalDivulgacionUbicacionProps) {
  const { colores } = useAltokkeTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRechazar}
    >
      <View style={styles.modalFondo}>
        <View
          style={[
            styles.modalCaja,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <View style={[styles.iconoContenedor, { backgroundColor: colores.exitoFondo }]}>
            <Ionicons name="navigate" size={32} color={colores.primario} />
          </View>

          <Text style={[styles.titulo, { color: colores.texto }]}>
            Uso de tu ubicación
          </Text>

          <Text style={[styles.descripcion, { color: colores.secundario }]}>
            Altokke recopila y utiliza tus datos de ubicación para calcular tarifas precisas,
            mostrar mototaxis cercanas y guiar el recorrido de tu viaje en tiempo real.
          </Text>

          {esSegundoPlano && (
            <View style={[styles.avisoSegundoPlano, { backgroundColor: colores.campo }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colores.primario} />
              <Text style={[styles.textoSegundoPlano, { color: colores.texto }]}>
                Durante un viaje activo, la ubicación se actualiza en segundo plano incluso si
                minimizas la aplicación, garantizando tu seguridad y la sincronización continua.
              </Text>
            </View>
          )}

          <View style={styles.botones}>
            <Pressable
              onPress={onAceptar}
              accessibilityRole="button"
              accessibilityLabel="Permitir acceso a ubicación"
              style={({ pressed }) => [
                styles.botonPrimario,
                {
                  backgroundColor: pressed
                    ? colores.primarioPresionado
                    : colores.primario,
                },
              ]}
            >
              <Text style={[styles.textoBotonPrimario, { color: colores.textoBoton }]}>
                Permitir y continuar
              </Text>
            </Pressable>

            <Pressable
              onPress={onRechazar}
              accessibilityRole="button"
              accessibilityLabel="Ahora no"
              style={({ pressed }) => [
                styles.botonSecundario,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.textoBotonSecundario, { color: colores.secundario }]}>
                Ahora no
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCaja: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconoContenedor: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  avisoSegundoPlano: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
  },
  textoSegundoPlano: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  botones: {
    width: "100%",
    gap: 10,
  },
  botonPrimario: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  textoBotonPrimario: {
    fontSize: 15,
    fontWeight: "600",
  },
  botonSecundario: {
    width: "100%",
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  textoBotonSecundario: {
    fontSize: 14,
    fontWeight: "500",
  },
});
