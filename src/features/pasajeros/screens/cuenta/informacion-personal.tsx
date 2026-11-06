import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AvatarPerfil } from "@/features/pasajeros/components/AvatarPerfil";
import {
  BarraSuperiorNavegacion,
  ModalEdicionTexto,
} from "@/shared/components/ui";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useSubirAvatar } from "@/features/pasajeros/hooks/useSubirAvatar";

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
      <Text style={[styles.tituloGrupo, { color: colores.secundario }]}>
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
                pressed &&
                  campo.editable && {
                    backgroundColor: colores.campo,
                  },
              ]}
            >
              <View style={styles.datosCampo}>
                <Text
                  style={[styles.etiquetaCampo, { color: colores.secundario }]}
                >
                  {campo.etiqueta}
                </Text>

                <Text
                  style={[styles.valorCampo, { color: colores.texto }]}
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

  const { subiendo: subiendoFoto, cambiarFoto } = useSubirAvatar({
    userId,
    onExito: recargar,
  });

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
      campo.valor === "Sin registrar" ? "" : campo.valor
    );
    setModalVisible(true);
  };

  const guardarCambio = async () => {
    if (!campoActual || !valorEdicion.trim() || guardando) return;

    if (!campoActual.editable) return;

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
      <BarraSuperiorNavegacion titulo="Mis datos" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <View style={styles.seccionFoto}>
          <AvatarPerfil
            nombre={perfil?.nombreCompleto || "Pasajero"}
            uri={perfil?.fotoUrl || undefined}
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
                style={{ marginRight: 6 }}
              />
            ) : (
              <Ionicons
                name="camera-outline"
                size={16}
                color={colores.exitoTexto}
                style={{ marginRight: 6 }}
              />
            )}

            <Text
              style={[
                styles.textoCambiarFoto,
                { color: colores.exitoTexto },
              ]}
            >
              {subiendoFoto ? "Guardando foto..." : "Cambiar foto"}
            </Text>
          </Pressable>
        </View>

        <GrupoCampos
          titulo="DATOS DE IDENTIDAD"
          campos={camposIdentidad}
          onSeleccionar={seleccionarCampo}
        />

        <GrupoCampos
          titulo="DATOS DE CONTACTO"
          campos={camposEditables}
          onSeleccionar={seleccionarCampo}
        />
      </ScrollView>

      <ModalEdicionTexto
        visible={modalVisible}
        titulo={campoActual?.etiqueta ? `Editar ${campoActual.etiqueta}` : "Editar dato"}
        etiqueta={campoActual?.etiqueta}
        valor={valorEdicion}
        onChangeValor={setValorEdicion}
        onCerrar={() => {
          if (!guardando) {
            setModalVisible(false);
            setCampoActual(null);
          }
        }}
        onGuardar={guardarCambio}
        guardando={guardando}
        tipoTeclado={campoActual?.teclado === "phone-pad" ? "phone-pad" : "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 36 },
  seccionFoto: { alignItems: "center", paddingTop: 26, paddingBottom: 30, gap: 14 },
  botonCambiarFoto: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  textoCambiarFoto: { fontSize: 14, fontWeight: "600" },
  grupo: { marginTop: 12, marginBottom: 12 },
  tituloGrupo: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },
  cajaCampos: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  filaCampo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 58,
  },
  datosCampo: { flex: 1, gap: 3 },
  etiquetaCampo: { fontSize: 11, fontWeight: "500" },
  valorCampo: { fontSize: 14, fontWeight: "600" },
  separador: { height: StyleSheet.hairlineWidth, marginLeft: 16, marginRight: 16 },
});
