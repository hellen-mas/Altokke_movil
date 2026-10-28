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
  View 
} from "react-native";

import { AvatarPerfil } from "@/features/pasajeros/components/AvatarPerfil";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { seleccionarFotoGaleria, subirFotoAvatar } from "@/shared/utils/avatar";

type ClaveCampo =
  | "nombre"
  | "apellidos"
  | "telefono"
  | "dni"
  | "fechaNacimiento"
  | "genero";

interface Campo {
  clave: ClaveCampo;
  etiqueta: string;
  valor: string;
  editable: boolean;
  teclado?: "default" | "phone-pad" | "numeric";
}

function GrupoCampos({
  titulo,
  campos,
  onSeleccionar,
}: {
  titulo: string;
  campos: Campo[];
  onSeleccionar: (campo: Campo) => void;
}) {
  const { colores } = useAltokkeTheme();

  return (
    <View style={styles.grupo}>
      <Text
        style={[
          styles.tituloGrupo,
          { color: colores.secundario },
        ]}
      >
        {titulo}
      </Text>

      <View
        style={[
          styles.cajaCampos,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        {campos.map((campo, index) => (
          <View key={campo.clave}>
            <Pressable
              onPress={() => onSeleccionar(campo)}
              accessibilityRole="button"
              accessibilityLabel={campo.etiqueta}
              style={({ pressed }) => [
                styles.filaCampo,
                pressed && campo.editable && {
                  backgroundColor: colores.campo,
                },
              ]}
            >
              <View style={styles.datosCampo}>
                <Text
                  style={[
                    styles.etiquetaCampo,
                    { color: colores.secundario },
                  ]}
                >
                  {campo.etiqueta}
                </Text>

                <Text
                  style={[
                    styles.valorCampo,
                    { color: colores.texto },
                  ]}
                  numberOfLines={2}
                >
                  {campo.valor || "Sin registrar"}
                </Text>
              </View>

              <Ionicons
                name={
                  campo.editable
                    ? "create-outline"
                    : "lock-closed-outline"
                }
                size={18}
                color={
                  campo.editable
                    ? colores.exitoTexto
                    : colores.secundario
                }
              />
            </Pressable>

            {index !== campos.length - 1 && (
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
  );
}

export default function InformacionPersonal() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { perfil, actualizarPerfil, recargar } = usePerfilPasajero();

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [campoActual, setCampoActual] = useState<Campo | null>(null);
  const [valorEdicion, setValorEdicion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const camposIdentidad: Campo[] = [
    {
      clave: "nombre",
      etiqueta: "Nombres",
      valor: perfil?.nombre || "",
      editable: false,
    },
    {
      clave: "apellidos",
      etiqueta: "Apellidos",
      valor: perfil?.apellidos || "",
      editable: false,
    },
    {
      clave: "dni",
      etiqueta: "DNI",
      valor: perfil?.dni || "Sin registrar",
      editable: false,
    },
    {
      clave: "fechaNacimiento",
      etiqueta: "Fecha de nacimiento",
      valor: perfil?.fechaNacimiento || "Sin registrar",
      editable: false,
    },
  ];

  const camposEditables: Campo[] = [
    {
      clave: "telefono",
      etiqueta: "Número de celular",
      valor: perfil?.telefono || "",
      editable: true,
      teclado: "phone-pad",
    },
    {
      clave: "genero",
      etiqueta: "Género",
      valor: perfil?.genero || "Sin registrar",
      editable: true,
    },
  ];

  const cambiarFoto = async () => {
    try {
      const res = await seleccionarFotoGaleria();
      if (!res || !userId) return;

      setSubiendoFoto(true);

      const subida = await subirFotoAvatar(res.uri, userId, res.base64);

      if (!subida.ok) throw new Error(subida.error);

      await recargar();
      Alert.alert("Foto actualizada", "Tu foto de perfil fue guardada correctamente.");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la foto."
      );
    } finally {
      setSubiendoFoto(false);
    }
  };

  const seleccionarCampo = (campo: Campo) => {
    if (!campo.editable) {
      Alert.alert(
        "Dato de identidad protegido",
        "Los nombres, apellidos, DNI y fecha de nacimiento no pueden modificarse desde la aplicación. Si necesitas corregirlos, comunícate con soporte de Altokke."
      );
      return;
    }

    setCampoActual(campo);
    setValorEdicion(
      campo.valor === "Sin registrar"
        ? ""
        : campo.valor
    );
    setModalVisible(true);
  };

  const guardarCambio = async () => {
    if (!campoActual || !valorEdicion.trim() || guardando) return;

    if (!campoActual.editable) {
      return;
    }

    try {
      setGuardando(true);

      await actualizarPerfil({ [campoActual.clave]: valorEdicion.trim() });
      setModalVisible(false);
      setCampoActual(null);
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la información."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Mis datos" />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {/* Fotografía */}
        <View style={styles.seccionFoto}>
          <AvatarPerfil
            nombre={perfil?.nombreCompleto || "Pasajero"}
            uri={perfil?.fotoUrl}
            tamano={88}
          />

          <Pressable
            onPress={cambiarFoto}
            disabled={subiendoFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
            style={({ pressed }) => [
              styles.botonCambiarFoto,
              pressed && { opacity: 0.7 },
            ]}
          >
            {subiendoFoto ? (
              <ActivityIndicator
                size="small"
                color={colores.exitoTexto}
              />
            ) : (
              <Ionicons
                name="camera-outline"
                size={18}
                color={colores.exitoTexto}
              />
            )}

            <Text
              style={[
                styles.textoCambiarFoto,
                { color: colores.exitoTexto },
              ]}
            >
              {subiendoFoto
                ? "Guardando foto..."
                : "Cambiar foto"}
            </Text>
          </Pressable>
        </View>

        {/* Datos verificados */}
        <GrupoCampos
          titulo="IDENTIDAD VERIFICADA"
          campos={camposIdentidad}
          onSeleccionar={seleccionarCampo}
        />

        {/* Datos editables */}
        <GrupoCampos
          titulo="CONTACTO Y PERFIL"
          campos={camposEditables}
          onSeleccionar={seleccionarCampo}
        />

        <View style={styles.aviso}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colores.secundario}
          />

          <Text
            style={[
              styles.textoAviso,
              { color: colores.secundario },
            ]}
          >
            Si necesitas corregir tus datos de identidad,
            comunícate con soporte de Altokke.
          </Text>
        </View>
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
            <View style={styles.modalEncabezado}>
              <Text
                style={[
                  styles.modalTitulo,
                  { color: colores.texto },
                ]}
              >
                Editar {campoActual?.etiqueta.toLowerCase()}
              </Text>

              <Pressable
                onPress={() => setModalVisible(false)}
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

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colores.textoCampo,
                  backgroundColor: colores.campo,
                },
              ]}
              value={valorEdicion}
              onChangeText={setValorEdicion}
              keyboardType={
                campoActual?.teclado || "default"
              }
              placeholder={`Ingresa ${campoActual?.etiqueta.toLowerCase() || "el dato"}`}
              placeholderTextColor={colores.secundario}
              autoFocus
            />

            <View style={styles.modalAcciones}>
              <Pressable
                style={[
                  styles.botonCancelar,
                  { borderColor: colores.linea },
                ]}
                onPress={() => setModalVisible(false)}
                disabled={guardando}
              >
                <Text
                  style={{
                    color: colores.secundario,
                    fontWeight: "600",
                  }}
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.botonGuardar,
                  {
                    backgroundColor: colores.primario,
                    opacity: guardando ? 0.6 : 1,
                  },
                ]}
                onPress={guardarCambio}
                disabled={guardando || !valorEdicion.trim()}
              >
                {guardando ? (
                  <ActivityIndicator
                    size="small"
                    color={colores.textoBoton}
                  />
                ) : (
                  <Text
                    style={{
                      color: colores.textoBoton,
                      fontWeight: "700",
                    }}
                  >
                    Guardar
                  </Text>
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
  pantalla: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  seccionFoto: {
    alignItems: "center",
    paddingTop: 26,
    paddingBottom: 30,
    gap: 12,
  },

  botonCambiarFoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 12,
  },

  textoCambiarFoto: {
    fontSize: 14,
    fontWeight: "600",
  },

  grupo: {
    marginBottom: 24,
    gap: 10,
  },

  tituloGrupo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },

  cajaCampos: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  filaCampo: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  datosCampo: {
    flex: 1,
    gap: 4,
  },

  etiquetaCampo: {
    fontSize: 12,
  },

  valorCampo: {
    fontSize: 15,
    fontWeight: "600",
  },

  separador: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },

  aviso: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 2,
  },

  textoAviso: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderRadius: 22,
    gap: 18,
  },

  modalEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitulo: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
  },

  modalInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  modalAcciones: {
    flexDirection: "row",
    gap: 10,
  },

  botonCancelar: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  botonGuardar: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
