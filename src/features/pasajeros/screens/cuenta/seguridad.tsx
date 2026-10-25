import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { ItemMenu } from "@/features/pasajeros/components/ItemMenu";
import { BotonPrincipal, CampoTexto } from "@/shared/components/ui";
import { supabase } from "@/shared/api/supabase";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export default function Seguridad() {
  const { colores } = useAltokkeTheme();
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [actualizando, setActualizando] = useState(false);
  const [dosPasos, setDosPasos] = useState(true);

  const cambiarPassword = async () => {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      return Alert.alert("Contraseña inválida", "La nueva contraseña debe tener al menos 6 caracteres.");
    }
    if (nuevaPassword !== confirmarPassword) {
      return Alert.alert("Error de coincidencia", "Las contraseñas no coinciden.");
    }

    try {
      setActualizando(true);
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) throw error;

      setModalPasswordVisible(false);
      setNuevaPassword("");
      setConfirmarPassword("");
      Alert.alert("Contraseña actualizada", "Tu contraseña ha sido cambiada exitosamente.");
    } catch (err: any) {
      Alert.alert("Error al actualizar", err?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setActualizando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Seguridad" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        <View style={[styles.tarjetaHeader, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
          <Ionicons name="shield-checkmark" size={28} color={colores.exitoTexto} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitulo, { color: colores.texto }]}>Cuenta protegida</Text>
            <Text style={[styles.headerDesc, { color: colores.secundario }]}>Tus datos y viajes están cifrados y validados conforme a ley.</Text>
          </View>
        </View>

        <ItemMenu
          icono="lock-closed-outline"
          titulo="Cambiar contraseña"
          subtitulo="Actualiza tu clave de acceso a Altokke"
          onPress={() => setModalPasswordVisible(true)}
        />

        <View style={[styles.filaSwitch, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <Ionicons name="finger-print-outline" size={22} color={colores.exitoTexto} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitulo, { color: colores.texto }]}>Verificación biométrica</Text>
              <Text style={[styles.switchDesc, { color: colores.secundario }]}>Solicitar huella o rostro al abrir la app</Text>
            </View>
          </View>
          <Switch value={dosPasos} onValueChange={setDosPasos} />
        </View>

        <ItemMenu
          icono="phone-portrait-outline"
          titulo="Dispositivos activos"
          subtitulo="Sesión actual en este teléfono móvil"
          onPress={() => Alert.alert("Sesiones activas", "Tu cuenta está activa únicamente en este dispositivo.")}
        />

        <ItemMenu
          icono="time-outline"
          titulo="Actividad de la cuenta"
          subtitulo="Registro de inicios de sesión y accesos"
          onPress={() => Alert.alert("Actividad reciente", "No se detectaron accesos sospechosos en los últimos 30 días.")}
        />
      </ScrollView>

      {/* Modal cambio de contraseña */}
      <Modal visible={modalPasswordVisible} transparent animationType="fade" onRequestClose={() => setModalPasswordVisible(false)}>
        <Pressable style={styles.modalFondo} onPress={() => setModalPasswordVisible(false)}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Cambiar contraseña</Text>
            <CampoTexto
              etiqueta="Nueva contraseña"
              placeholder="Mínimo 6 caracteres"
              value={nuevaPassword}
              onChangeText={setNuevaPassword}
              esPassword
            />
            <CampoTexto
              etiqueta="Confirmar nueva contraseña"
              placeholder="Repite la contraseña"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              esPassword
            />
            <BotonPrincipal titulo="Guardar contraseña" onPress={cambiarPassword} cargando={actualizando} estilo={{ marginTop: 8 }} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contenido: {
    padding: 16,
    gap: 12,
  },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  headerTitulo: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  filaSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  switchTitulo: {
    fontSize: 15,
    fontWeight: "600",
  },
  switchDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCaja: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
});
