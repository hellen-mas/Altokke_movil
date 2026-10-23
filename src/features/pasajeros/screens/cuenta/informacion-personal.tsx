import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AvatarPerfil } from "@/features/pasajeros/components/AvatarPerfil";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { seleccionarFotoGaleria, subirFotoAvatar } from "@/shared/utils/avatar";

interface CampoEditable {
  clave: "nombre" | "apellidos" | "telefono" | "dni" | "fechaNacimiento" | "genero";
  etiqueta: string;
  valor: string;
  teclado?: "default" | "phone-pad" | "numeric";
  editable: boolean;
}

export default function InformacionPersonal() {
  const { colores, esOscuro } = useAltokkeTheme();
  const { userId } = useAuth();
  const { perfil, actualizarPerfil, recargar } = usePerfilPasajero();

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [campoSeleccionado, setCampoSeleccionado] = useState<CampoEditable | null>(null);
  const [valorEdicion, setValorEdicion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const foto = perfil?.fotoUrl || null;
  const nombre = perfil?.nombreCompleto || perfil?.primerNombre || "Pasajero";

  const campos: CampoEditable[] = [
    {
      clave: "nombre",
      etiqueta: "Nombres",
      valor: perfil?.nombre || "",
      editable: true,
      teclado: "default",
    },
    {
      clave: "apellidos",
      etiqueta: "Apellidos",
      valor: perfil?.apellidos || "",
      editable: true,
      teclado: "default",
    },
    {
      clave: "telefono",
      etiqueta: "Número de teléfono",
      valor: perfil?.telefono || "Sin registrar",
      editable: true,
      teclado: "phone-pad",
    },
    {
      clave: "dni",
      etiqueta: "Documento de identidad (DNI)",
      valor: perfil?.dni || "Sin registrar",
      editable: true,
      teclado: "numeric",
    },
    {
      clave: "fechaNacimiento",
      etiqueta: "Fecha de nacimiento",
      valor: perfil?.fechaNacimiento || "Sin registrar",
      editable: true,
      teclado: "default",
    },
    {
      clave: "genero",
      etiqueta: "Género",
      valor: perfil?.genero || "Sin registrar",
      editable: true,
      teclado: "default",
    },
  ];

  const abrirEdicion = (campo: CampoEditable) => {
    setCampoSeleccionado(campo);
    setValorEdicion(campo.valor === "Sin registrar" ? "" : campo.valor);
    setModalVisible(true);
  };

  const guardarCambio = async () => {
    if (!campoSeleccionado || !userId) return;

    try {
      setGuardando(true);
      const valorLimpio = valorEdicion.trim();

      await actualizarPerfil({
        [campoSeleccionado.clave]: valorLimpio || "Sin registrar",
      });

      setModalVisible(false);
      Alert.alert("Éxito", `${campoSeleccionado.etiqueta} actualizado correctamente.`);
    } catch (error: any) {
      Alert.alert("Error al actualizar", error?.message || "No se pudo guardar la información.");
    } finally {
      setGuardando(false);
    }
  };

  const elegirFoto = async () => {
    if (!userId) {
      Alert.alert("Sesión requerida", "Debes iniciar sesión para actualizar tu foto de perfil.");
      return;
    }

    try {
      const fotoSeleccionada = await seleccionarFotoGaleria();
      if (!fotoSeleccionada) return;

      setSubiendoFoto(true);

      const resultado = await subirFotoAvatar(
        fotoSeleccionada,
        userId,
        fotoSeleccionada.base64
      );

      setSubiendoFoto(false);

      if (resultado.ok && resultado.url) {
        await recargar();
        Alert.alert("Foto de perfil", "Tu foto de perfil se actualizó exitosamente.");
      } else {
        Alert.alert(
          "No se pudo guardar la foto",
          resultado.error || "Hubo un error al procesar tu foto de perfil."
        );
      }
    } catch (error: any) {
      setSubiendoFoto(false);
      Alert.alert("Foto de perfil", error?.message || "Error al seleccionar la imagen.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Información personal" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {/* Foto de perfil */}
        <Pressable
          style={({ pressed }) => [
            styles.fila,
            { borderBottomColor: colores.linea },
            pressed && { opacity: 0.7 },
          ]}
          onPress={elegirFoto}
          disabled={subiendoFoto}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
        >
          <View style={styles.avatarWrapper}>
            <AvatarPerfil nombre={nombre} tamano={52} uri={foto} />
            {subiendoFoto && (
              <View style={styles.avatarCargando}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.textos}>
            <Text style={[styles.etiquetaFoto, { color: colores.texto }]}>
              Foto de perfil
            </Text>
            <Text style={[styles.subtituloFoto, { color: colores.secundario }]}>
              {subiendoFoto ? "Validando y subiendo..." : "Toca para cambiar tu foto"}
            </Text>
          </View>

          {subiendoFoto ? (
            <ActivityIndicator size="small" color={colores.primario} />
          ) : (
            <Ionicons name="camera-outline" size={20} color={colores.primario} />
          )}
        </Pressable>

        {/* Correo Electrónico (Solo Lectura) */}
        <View style={[styles.fila, { borderBottomColor: colores.linea }]}>
          <View style={styles.textos}>
            <Text style={[styles.etiqueta, { color: colores.texto }]}>
              Correo electrónico
            </Text>
            <Text style={[styles.valor, { color: colores.secundario }]}>
              {perfil?.correo || "Sin correo"}
            </Text>
          </View>
          <View style={[styles.insigniaVerificado, { backgroundColor: colores.exitoFondo }]}>
            <Ionicons name="checkmark-circle" size={14} color={colores.exitoTexto} />
            <Text style={[styles.textoVerificado, { color: colores.exitoTexto }]}>Cuenta</Text>
          </View>
        </View>

        {/* Lista de campos interactivos */}
        {campos.map((campo) => (
          <Pressable
            key={campo.clave}
            style={({ pressed }) => [
              styles.fila,
              { borderBottomColor: colores.linea },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => abrirEdicion(campo)}
            accessibilityRole="button"
          >
            <View style={styles.textos}>
              <Text style={[styles.etiqueta, { color: colores.texto }]}>
                {campo.etiqueta}
              </Text>
              <Text
                style={[
                  styles.valor,
                  {
                    color:
                      campo.valor === "Sin registrar"
                        ? colores.secundario
                        : colores.texto,
                  },
                ]}
              >
                {campo.valor}
              </Text>
            </View>
            <Ionicons name="pencil-outline" size={18} color={colores.secundario} />
          </Pressable>
        ))}
      </ScrollView>

      {/* Modal de edición */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
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
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>
              Editar {campoSeleccionado?.etiqueta}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colores.textoCampo,
                  backgroundColor: colores.campo,
                  borderColor: colores.linea,
                },
              ]}
              value={valorEdicion}
              onChangeText={setValorEdicion}
              keyboardType={campoSeleccionado?.teclado || "default"}
              placeholder={`Ingresa ${campoSeleccionado?.etiqueta.toLowerCase()}`}
              placeholderTextColor={colores.secundario}
              autoFocus
            />

            <View style={styles.modalBotones}>
              <Pressable
                style={[styles.botonModal, { borderColor: colores.linea, borderWidth: 1 }]}
                onPress={() => setModalVisible(false)}
                disabled={guardando}
              >
                <Text style={[styles.botonTextoSecundario, { color: colores.secundario }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[styles.botonModal, { backgroundColor: colores.primario }]}
                onPress={guardarCambio}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.botonTextoPrimario}>Guardar</Text>
                )}
              </Pressable>
            </View>
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

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatarCargando: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  etiquetaFoto: {
    fontSize: 15,
    fontWeight: "600",
  },

  subtituloFoto: {
    marginTop: 2,
    fontSize: 12,
  },

  textos: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
  },

  valor: {
    marginTop: 3,
    fontSize: 14,
  },

  insigniaVerificado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  textoVerificado: {
    fontSize: 12,
    fontWeight: "600",
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },

  modalTitulo: {
    fontSize: 17,
    fontWeight: "700",
  },

  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  modalBotones: {
    flexDirection: "row",
    gap: 12,
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
    fontSize: 15,
    fontWeight: "600",
  },

  botonTextoPrimario: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
