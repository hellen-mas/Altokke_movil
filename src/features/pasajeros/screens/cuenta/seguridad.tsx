import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BarraSuperiorNavegacion,
  CampoTexto,
  ContenedorGrupoAjustes,
  FilaOpcionMenu,
} from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useCambiarPassword } from "@/features/autenticacion/hooks/useCambiarPassword";

type NombreIcono = keyof typeof Ionicons.glyphMap;

const OPCIONES_FUTURAS: {
  titulo: string;
  icono: NombreIcono;
}[] = [
  { titulo: "Acceso biométrico", icono: "finger-print-outline" },
  { titulo: "Dispositivos activos", icono: "phone-portrait-outline" },
  { titulo: "Actividad de la cuenta", icono: "time-outline" },
];

export default function Seguridad() {
  const { colores } = useAltokkeTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const { cargando: actualizando, cambiarPassword } = useCambiarPassword({
    onExito: () => {
      setModalVisible(false);
      setNuevaPassword("");
      setConfirmarPassword("");
      Alert.alert(
        "Contraseña actualizada",
        "Tu contraseña ha sido cambiada exitosamente."
      );
    },
  });

  const cerrarModal = () => {
    if (actualizando) return;
    setModalVisible(false);
    setNuevaPassword("");
    setConfirmarPassword("");
  };

  const ejecutarCambioPassword = async () => {
    await cambiarPassword(nuevaPassword, confirmarPassword);
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <BarraSuperiorNavegacion titulo="Seguridad" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <View
          style={[
            styles.introduccion,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.introSuperior}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colores.exitoTexto}
            />
            <Text style={[styles.introTitulo, { color: colores.texto }]}>
              Tu cuenta está protegida
            </Text>
          </View>

          <Text
            style={[styles.introDescripcion, { color: colores.secundario }]}
          >
            Administra tus métodos de acceso y credenciales de seguridad para
            mantener tu cuenta a salvo.
          </Text>
        </View>

        <ContenedorGrupoAjustes titulo="CREDENCIALES DE ACCESO">
          <FilaOpcionMenu
            icono="lock-closed-outline"
            titulo="Contraseña"
            descripcion="Cambia tu clave de inicio de sesión"
            onPress={() => setModalVisible(true)}
            ultimo
          />
        </ContenedorGrupoAjustes>

        <ContenedorGrupoAjustes titulo="SEGURIDAD AVANZADA">
          {OPCIONES_FUTURAS.map((opcion, index) => (
            <FilaOpcionMenu
              key={opcion.titulo}
              icono={opcion.icono}
              titulo={opcion.titulo}
              onPress={() =>
                Alert.alert(
                  opcion.titulo,
                  "Esta función estará disponible en las próximas versiones de Altokke."
                )
              }
              derecha={
                <Text
                  style={[
                    styles.proximamente,
                    { color: colores.secundario },
                  ]}
                >
                  Próximamente
                </Text>
              }
              ultimo={index === OPCIONES_FUTURAS.length - 1}
            />
          ))}
        </ContenedorGrupoAjustes>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
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
                Cambiar contraseña
              </Text>

              <Pressable
                onPress={cerrarModal}
                disabled={actualizando}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Cerrar modal"
                style={({ pressed }) => [pressed && { opacity: 0.6 }]}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colores.secundario}
                />
              </Pressable>
            </View>

            <Text
              style={[
                styles.modalDescripcion,
                { color: colores.secundario },
              ]}
            >
              Escribe y confirma tu nueva contraseña. Debe contener al menos 8
              caracteres, una mayúscula, un número y un símbolo.
            </Text>

            <CampoTexto
              etiqueta="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              value={nuevaPassword}
              onChangeText={setNuevaPassword}
              esPassword
            />

            <CampoTexto
              etiqueta="Confirmar contraseña"
              placeholder="Repite la contraseña"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              esPassword
            />

            <Pressable
              onPress={ejecutarCambioPassword}
              disabled={
                actualizando ||
                !nuevaPassword ||
                !confirmarPassword
              }
              accessibilityRole="button"
              accessibilityLabel="Guardar contraseña"
              style={({ pressed }) => [
                styles.botonGuardar,
                {
                  backgroundColor: pressed
                    ? colores.primarioPresionado
                    : colores.primario,
                  opacity:
                    actualizando || !nuevaPassword || !confirmarPassword
                      ? 0.5
                      : 1,
                },
              ]}
            >
              {actualizando ? (
                <ActivityIndicator
                  size="small"
                  color={colores.textoBoton}
                />
              ) : (
                <Text
                  style={[
                    styles.textoGuardar,
                    { color: colores.textoBoton },
                  ]}
                >
                  Guardar contraseña
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
    gap: 24,
  },
  introduccion: {
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  introSuperior: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  introTitulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  introDescripcion: {
    fontSize: 13,
    lineHeight: 20,
  },
  proximamente: {
    fontSize: 12,
    fontWeight: "500",
  },
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
