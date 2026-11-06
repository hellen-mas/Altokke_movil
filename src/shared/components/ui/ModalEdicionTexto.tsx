import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { CampoTexto } from "./CampoTexto";

export interface PropsModalEdicionTexto {
  visible: boolean;
  titulo: string;
  descripcion?: string;
  etiqueta?: string;
  placeholder?: string;
  valor: string;
  onChangeValor: (texto: string) => void;
  onCerrar: () => void;
  onGuardar: () => void;
  guardando?: boolean;
  tipoTeclado?: "default" | "email-address" | "phone-pad" | "numeric";
}

export function ModalEdicionTexto({
  visible,
  titulo,
  descripcion,
  etiqueta,
  placeholder,
  valor,
  onChangeValor,
  onCerrar,
  onGuardar,
  guardando = false,
  tipoTeclado = "default",
}: PropsModalEdicionTexto) {
  const { colores } = useAltokkeTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalFondo}
      >
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
              {titulo}
            </Text>

            <Pressable
              onPress={onCerrar}
              disabled={guardando}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal"
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={22} color={colores.secundario} />
            </Pressable>
          </View>

          {descripcion ? (
            <Text
              style={[
                styles.modalDescripcion,
                { color: colores.secundario },
              ]}
            >
              {descripcion}
            </Text>
          ) : null}

          <CampoTexto
            etiqueta={etiqueta}
            placeholder={placeholder}
            value={valor}
            onChangeText={onChangeValor}
            keyboardType={tipoTeclado}
            autoFocus
          />

          <Pressable
            onPress={onGuardar}
            disabled={guardando || !valor.trim()}
            accessibilityRole="button"
            accessibilityLabel="Guardar cambios"
            style={({ pressed }) => [
              styles.botonGuardar,
              {
                backgroundColor: pressed
                  ? colores.primarioPresionado
                  : colores.primario,
                opacity: guardando || !valor.trim() ? 0.5 : 1,
              },
            ]}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={colores.textoBoton} />
            ) : (
              <Text
                style={[
                  styles.textoGuardar,
                  { color: colores.textoBoton },
                ]}
              >
                Guardar cambios
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  modalDescripcion: {
    fontSize: 13,
    lineHeight: 19,
  },
  botonGuardar: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  textoGuardar: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default ModalEdicionTexto;
