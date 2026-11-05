import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import {
  AvisoInformativo,
  BotonPrincipal,
  CampoTexto,
} from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useCambiarPassword } from "@/features/autenticacion/hooks/useCambiarPassword";

export default function CambiarContrasena() {
  const { colores } = useAltokkeTheme();
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const { cargando, cambiarPassword } = useCambiarPassword({
    onExito: () => {
      Alert.alert(
        "Contraseña actualizada",
        "Tu contraseña fue actualizada correctamente.",
        [{ text: "Entendido", onPress: () => router.back() }]
      );
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
    },
  });

  const guardarCambios = async () => {
    if (!contrasenaActual) {
      Alert.alert("Campo incompleto", "Ingresa tu contraseña actual.");
      return;
    }
    await cambiarPassword(nuevaContrasena, confirmarContrasena, contrasenaActual);
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <CabeceraConductor
        titulo="Cambiar contraseña"
        subtitulo="Actualiza tu contraseña de acceso"
        mostrarAtras
        compacta
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.introCard,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={24}
            color={colores.exitoTexto}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitulo, { color: colores.texto }]}>
              Protege tu cuenta
            </Text>
            <Text
              style={[styles.introDescripcion, { color: colores.secundario }]}
            >
              Utiliza una contraseña segura y diferente a la de otros servicios.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.formularioCard,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <CampoTexto
            etiqueta="Contraseña actual"
            placeholder="Ingresa tu contraseña actual"
            value={contrasenaActual}
            onChangeText={setContrasenaActual}
            esPassword
          />
          <CampoTexto
            etiqueta="Nueva contraseña"
            placeholder="Mínimo 8 caracteres (mayús, min, núm, símb)"
            value={nuevaContrasena}
            onChangeText={setNuevaContrasena}
            esPassword
          />
          <CampoTexto
            etiqueta="Confirmar nueva contraseña"
            placeholder="Repite la nueva contraseña"
            value={confirmarContrasena}
            onChangeText={setConfirmarContrasena}
            esPassword
          />

          <BotonPrincipal
            titulo="Actualizar contraseña"
            onPress={guardarCambios}
            cargando={cargando}
            disabled={cargando}
            estilo={{ marginTop: 12 }}
          />
        </View>

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tu información está protegida con cifrado de punto a punto."
          variante="claro"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  introCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  introTitulo: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  introDescripcion: { fontSize: 13, lineHeight: 18 },
  formularioCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
});
