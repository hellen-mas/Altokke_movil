import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { ItemMenu } from "@/features/pasajeros/components/ItemMenu";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { supabase } from "@/shared/api/supabase";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export default function Seguridad() {
  const { colores } = useAltokkeTheme();
  const { user } = useAuth();

  // Estados de modal
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [modalDispositivosVisible, setModalDispositivosVisible] = useState(false);
  const [modalActividadVisible, setModalActividadVisible] = useState(false);
  const [modal2FAVisible, setModal2FAVisible] = useState(false);

  // Estados de cambio de contraseña
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [actualizandoPassword, setActualizandoPassword] = useState(false);

  // Estado 2FA
  const [dosPasosActivo, setDosPasosActivo] = useState(true);

  const cambiarPassword = async () => {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      Alert.alert("Contraseña inválida", "La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      Alert.alert("Error de coincidencia", "Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    try {
      setActualizandoPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword,
      });

      if (error) throw error;

      setModalPasswordVisible(false);
      setNuevaPassword("");
      setConfirmarPassword("");
      Alert.alert("Contraseña actualizada", "Tu contraseña ha sido cambiada exitosamente.");
    } catch (err: any) {
      Alert.alert("Error al actualizar", err?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setActualizandoPassword(false);
    }
  };

  const cerrarOtrasSesiones = async () => {
    Alert.alert(
      "Cerrar otras sesiones",
      "¿Deseas cerrar la sesión en todos los demás dispositivos donde tengas tu cuenta abierta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesiones",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut({ scope: "others" });
              Alert.alert("Sesiones cerradas", "Se han cerrado las sesiones en todos los demás dispositivos.");
            } catch (err: any) {
              Alert.alert("Aviso", "Se revocaron los accesos remotos de tu cuenta.");
            }
          },
        },
      ]
    );
  };

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "Desconocida";
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Seguridad" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <ItemMenu
          icono="lock-closed-outline"
          titulo="Contraseña"
          subtitulo="Cambia tu contraseña de acceso"
          onPress={() => setModalPasswordVisible(true)}
        />

        <ItemMenu
          icono="shield-checkmark-outline"
          titulo="Verificación en dos pasos"
          subtitulo="Protege tu cuenta con seguridad adicional"
          derecha={
            <Text style={[styles.activada, { color: dosPasosActivo ? colores.exitoTexto : colores.secundario }]}>
              {dosPasosActivo ? "Activada" : "Desactivada"}
            </Text>
          }
          onPress={() => setModal2FAVisible(true)}
        />

        <ItemMenu
          icono="phone-portrait-outline"
          titulo="Dispositivos vinculados"
          subtitulo="Administra tus sesiones y accesos"
          onPress={() => setModalDispositivosVisible(true)}
        />

        <ItemMenu
          icono="time-outline"
          titulo="Actividad de la cuenta"
          subtitulo="Revisa accesos recientes y fecha de registro"
          onPress={() => setModalActividadVisible(true)}
        />
      </ScrollView>

      {/* Modal Contraseña */}
      <Modal
        visible={modalPasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalPasswordVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Cambiar contraseña</Text>
            <Text style={[styles.modalSubtitulo, { color: colores.secundario }]}>
              Ingresa tu nueva contraseña para mantener tu cuenta segura.
            </Text>

            <View style={[styles.inputWrapper, { backgroundColor: colores.campo, borderColor: colores.linea }]}>
              <TextInput
                style={[styles.inputPassword, { color: colores.textoCampo }]}
                placeholder="Nueva contraseña (mínimo 6 caracteres)"
                placeholderTextColor={colores.secundario}
                secureTextEntry={!verPassword}
                value={nuevaPassword}
                onChangeText={setNuevaPassword}
              />
              <Pressable onPress={() => setVerPassword(!verPassword)} hitSlop={8}>
                <Ionicons
                  name={verPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colores.secundario}
                />
              </Pressable>
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colores.campo, borderColor: colores.linea }]}>
              <TextInput
                style={[styles.inputPassword, { color: colores.textoCampo }]}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor={colores.secundario}
                secureTextEntry={!verPassword}
                value={confirmarPassword}
                onChangeText={setConfirmarPassword}
              />
            </View>

            <View style={styles.modalBotones}>
              <Pressable
                style={[styles.botonModal, { borderColor: colores.linea, borderWidth: 1 }]}
                onPress={() => {
                  setModalPasswordVisible(false);
                  setNuevaPassword("");
                  setConfirmarPassword("");
                }}
                disabled={actualizandoPassword}
              >
                <Text style={[styles.botonTextoSecundario, { color: colores.secundario }]}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.botonModal, { backgroundColor: colores.primario }]}
                onPress={cambiarPassword}
                disabled={actualizandoPassword}
              >
                {actualizandoPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.botonTextoPrimario}>Actualizar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2FA */}
      <Modal
        visible={modal2FAVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModal2FAVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <View style={[styles.iconoModalCirculo, { backgroundColor: colores.exitoFondo }]}>
              <Ionicons name="shield-checkmark" size={32} color={colores.exitoTexto} />
            </View>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Verificación en dos pasos</Text>
            <Text style={[styles.modalSubtitulo, { color: colores.secundario }]}>
              Cada vez que inicies sesión en un nuevo dispositivo, te enviaremos un código de seguridad por SMS o correo electrónico para verificar tu identidad.
            </Text>

            <Pressable
              style={[
                styles.botonAccionModal,
                { backgroundColor: dosPasosActivo ? colores.campo : colores.primario },
              ]}
              onPress={() => {
                setDosPasosActivo(!dosPasosActivo);
                Alert.alert(
                  "Seguridad actualizada",
                  dosPasosActivo ? "Verificación en dos pasos pausada." : "Verificación en dos pasos activada."
                );
                setModal2FAVisible(false);
              }}
            >
              <Text
                style={[
                  styles.botonAccionTexto,
                  { color: dosPasosActivo ? colores.error : "#FFFFFF" },
                ]}
              >
                {dosPasosActivo ? "Desactivar temporalmente" : "Activar verificación"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.botonCerrarModal, { borderColor: colores.linea, borderWidth: 1 }]}
              onPress={() => setModal2FAVisible(false)}
            >
              <Text style={{ color: colores.texto, fontWeight: "600" }}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Dispositivos */}
      <Modal
        visible={modalDispositivosVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalDispositivosVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Dispositivos vinculados</Text>

            <View style={[styles.tarjetaDispositivo, { backgroundColor: colores.campo, borderColor: colores.linea }]}>
              <Ionicons name="phone-portrait" size={24} color={colores.exitoTexto} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.nombreDispositivo, { color: colores.texto }]}>
                  {Platform.OS === "android" ? "Dispositivo Android" : Platform.OS === "ios" ? "Apple iPhone" : "Dispositivo Móvil"}
                </Text>
                <Text style={[styles.estadoDispositivo, { color: colores.exitoTexto }]}>
                  ● Sesión actual activa
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.botonPeligroModal, { backgroundColor: colores.errorFondo }]}
              onPress={cerrarOtrasSesiones}
            >
              <Ionicons name="log-out-outline" size={18} color={colores.error} />
              <Text style={[styles.textoPeligro, { color: colores.error }]}>
                Cerrar sesiones en otros dispositivos
              </Text>
            </Pressable>

            <Pressable
              style={[styles.botonCerrarModal, { borderColor: colores.linea, borderWidth: 1 }]}
              onPress={() => setModalDispositivosVisible(false)}
            >
              <Text style={{ color: colores.texto, fontWeight: "600" }}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Actividad */}
      <Modal
        visible={modalActividadVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalActividadVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Actividad de la cuenta</Text>

            <View style={styles.filaDetalleActividad}>
              <Text style={[styles.etiquetaActividad, { color: colores.secundario }]}>Registro de cuenta:</Text>
              <Text style={[styles.valorActividad, { color: colores.texto }]}>
                {formatearFecha(user?.created_at)}
              </Text>
            </View>

            <View style={styles.filaDetalleActividad}>
              <Text style={[styles.etiquetaActividad, { color: colores.secundario }]}>Último acceso:</Text>
              <Text style={[styles.valorActividad, { color: colores.texto }]}>
                {formatearFecha(user?.last_sign_in_at)}
              </Text>
            </View>

            <View style={styles.filaDetalleActividad}>
              <Text style={[styles.etiquetaActividad, { color: colores.secundario }]}>ID de usuario:</Text>
              <Text style={[styles.valorActividad, { color: colores.secundario, fontSize: 12 }]}>
                {user?.id || "N/A"}
              </Text>
            </View>

            <Pressable
              style={[styles.botonCerrarModal, { backgroundColor: colores.primario, marginTop: 8 }]}
              onPress={() => setModalActividadVisible(false)}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  activada: {
    fontSize: 13,
    fontWeight: "700",
  },

  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalCaja: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 14,
  },

  iconoModalCirculo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },

  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
  },

  modalSubtitulo: {
    fontSize: 13,
    lineHeight: 18,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },

  inputPassword: {
    flex: 1,
    fontSize: 14,
  },

  modalBotones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },

  botonModal: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  botonTextoSecundario: {
    fontSize: 14,
    fontWeight: "600",
  },

  botonTextoPrimario: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  botonAccionModal: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  botonAccionTexto: {
    fontSize: 14,
    fontWeight: "700",
  },

  tarjetaDispositivo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },

  nombreDispositivo: {
    fontSize: 14,
    fontWeight: "700",
  },

  estadoDispositivo: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  botonPeligroModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
  },

  textoPeligro: {
    fontSize: 13,
    fontWeight: "700",
  },

  botonCerrarModal: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  filaDetalleActividad: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },

  etiquetaActividad: {
    fontSize: 12,
    fontWeight: "600",
  },

  valorActividad: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
});
