import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
  View 
} from "react-native";

import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { CampoTexto } from "@/shared/components/ui";
import { supabase } from "@/shared/api/supabase";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

type NombreIcono = keyof typeof Ionicons.glyphMap;

const OPCIONES_FUTURAS: {
  titulo: string;
  icono: NombreIcono;
}[] = [
  {
    titulo: "Acceso biométrico",
    icono: "finger-print-outline",
  },
  {
    titulo: "Dispositivos activos",
    icono: "phone-portrait-outline",
  },
  {
    titulo: "Actividad de la cuenta",
    icono: "time-outline",
  },
];

export default function Seguridad() {
  const { colores } = useAltokkeTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [actualizando, setActualizando] = useState(false);

  const cerrarModal = () => {
    if (actualizando) return;

    setModalVisible(false);
    setNuevaPassword("");
    setConfirmarPassword("");
  };

  const cambiarPassword = async () => {
    if (actualizando) return;

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

      setModalVisible(false);
      setNuevaPassword("");
      setConfirmarPassword("");
      Alert.alert("Contraseña actualizada", "Tu contraseña ha sido cambiada exitosamente.");
    } catch (error: any) {
      Alert.alert(
        "No se pudo actualizar",
        error instanceof Error
          ? error.message
          : "Inténtalo nuevamente."
      );
    } finally {
      setActualizando(false);
    }
  };

  return (
    <View 
      style={[
        styles.pantalla,
        { backgroundColor: colores.fondo },
      ]}
    >
      <EncabezadoPantalla titulo="Seguridad" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        {/* Introducción */}
        <View 
          style={[
            styles.introduccion,
            { backgroundColor: colores.exitoFondo },
          ]}
        >
          <View style={styles.introSuperior}>
            <Ionicons
              name="shield-checkmark-outline"
              size={26}
              color={colores.exitoTexto}
            />

            <Text
              style={[
                styles.introTitulo,
                { color: colores.texto },
              ]}
            >
              Protege tu cuenta
            </Text>
          </View>

          <Text
            style={[
              styles.introDescripcion,
              { color: colores.secundario },
            ]}
          >
            Administra tus credenciales y mantén seguro
            el acceso a Altokke.
          </Text>
        </View>

        {/* Acceso */}
        <View style={styles.grupo}>
          <Text
            style={[
              styles.tituloGrupo,
              { color: colores.secundario },
            ]}
          >
            ACCESO A TU CUENTA
          </Text>

          <View
            style={[
              styles.tarjeta,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            <Pressable
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Cambiar contraseña"
              style={({ pressed }) => [
                styles.fila,
                pressed && {
                  backgroundColor: colores.campo,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={colores.exitoTexto}
              />

              <View style={styles.textos}>
                <Text
                  style={[
                    styles.filaTitulo,
                    { color: colores.texto },
                  ]}
                >
                  Cambiar contraseña
                </Text>

                <Text
                  style={[
                    styles.filaDescripcion,
                    { color: colores.secundario },
                  ]}
                >
                  Actualiza tu clave de acceso
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color={colores.secundario}
              />
            </Pressable>
          </View>
        </View>

        {/* Funciones futuraas */}
        <View style={styles.grupo}>
          <Text
            style={[
              styles.tituloGrupo,
              { color: colores.secundario },
            ]}
          >
            OTRAS OPCIONES
          </Text>

          <View
            style={[
              styles.tarjeta,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            {OPCIONES_FUTURAS.map((opcion, index) => (
              <View key={opcion.titulo}>
                <View style={styles.fila}>
                  <Ionicons
                    name={opcion.icono}
                    size={22}
                    color={colores.secundario}
                  />

                  <Text
                    style={[
                      styles.filaTitulo,
                      styles.textoFlexible,
                      { color: colores.texto },
                    ]}
                  >
                    {opcion.titulo}
                  </Text>

                  <Text
                    style={[
                      styles.proximamente,
                      { color: colores.secundario },
                    ]}
                  >
                    Próximamente
                  </Text>
                </View>

                {index !== OPCIONES_FUTURAS.length - 1 && (
                  <View
                    style={[
                      styles.separador,
                      { backgroundColor: colores.linea },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Cambiar contraseña */}
      <Modal 
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <KeyboardAvoidingView
          style={styles.modalFondo}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <Text
                style={[
                  styles.modalTitulo,
                  { color: colores.texto },
                ]}
              >
                Cambiar contraseña
              </Text>

              <Pressable
                onPress={cerrarModal}
                disabled={actualizando}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={10}
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
              Escribe y confirma tu nueva contraseña.
            </Text>

            <CampoTexto
              etiqueta="Nueva contraseña"
              placeholder="Mínimo 6 caracteres"
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
              onPress={cambiarPassword}
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
                    {
                      color: colores.textoBoton
                    },
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
  pantalla: {
    flex: 1,
  },
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

  grupo: {
    gap: 10,
  },

  tituloGrupo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },

  tarjeta: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  fila: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  textos: {
    flex: 1,
    gap: 3,
  },

  textoFlexible: {
    flex: 1,
  },

  filaTitulo: {
    fontSize: 14,
    fontWeight: "600",
  },

  filaDescripcion: {
    fontSize: 12,
  },

  proximamente: {
    fontSize: 11,
  },

  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
    marginRight: 16,
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
