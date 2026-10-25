import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AvatarPerfil } from "@/features/pasajeros/components/AvatarPerfil";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { seleccionarFotoGaleria, subirFotoAvatar } from "@/shared/utils/avatar";

interface Campo {
  clave: "nombre" | "apellidos" | "telefono" | "dni" | "fechaNacimiento" | "genero";
  etiqueta: string;
  valor: string;
  editable: boolean;
  teclado?: "default" | "phone-pad" | "numeric";
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

  const campos: Campo[] = [
    { clave: "nombre", etiqueta: "Nombres", valor: perfil?.nombre || "", editable: true },
    { clave: "apellidos", etiqueta: "Apellidos", valor: perfil?.apellidos || "", editable: true },
    { clave: "telefono", etiqueta: "Teléfono", valor: perfil?.telefono || "", editable: true, teclado: "phone-pad" },
    { clave: "dni", etiqueta: "DNI", valor: perfil?.dni || "Sin registrar", editable: false },
    { clave: "fechaNacimiento", etiqueta: "Fecha de nacimiento", valor: perfil?.fechaNacimiento || "Sin registrar", editable: false },
    { clave: "genero", etiqueta: "Género", valor: perfil?.genero || "Sin registrar", editable: true },
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
      Alert.alert("Error", err?.message || "No se pudo actualizar la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarCambio = async () => {
    if (!campoActual || !valorEdicion.trim()) return;
    try {
      setGuardando(true);
      await actualizarPerfil({ [campoActual.clave]: valorEdicion.trim() });
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo actualizar la información.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Información personal" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        <Pressable style={[styles.fila, { borderColor: colores.linea }]} onPress={cambiarFoto} disabled={subiendoFoto}>
          <AvatarPerfil nombre={perfil?.nombre || "Pasajero"} uri={perfil?.fotoUrl} tamano={56} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.etiqueta, { color: colores.texto }]}>Foto de perfil</Text>
            <Text style={[styles.subtexto, { color: colores.secundario }]}>Toca para cambiar</Text>
          </View>
          {subiendoFoto ? <ActivityIndicator size="small" color={colores.exitoTexto} /> : <Ionicons name="camera-outline" size={20} color={colores.secundario} />}
        </Pressable>

        {campos.map((c) => (
          <Pressable
            key={c.clave}
            style={[styles.fila, { borderColor: colores.linea }]}
            onPress={() => {
              if (!c.editable) return Alert.alert("Campo bloqueado", "Por seguridad, el DNI y la fecha de nacimiento no se pueden editar.");
              setCampoActual(c);
              setValorEdicion(c.valor);
              setModalVisible(true);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.etiqueta, { color: colores.texto }]}>{c.etiqueta}</Text>
              <Text style={[styles.subtexto, { color: colores.secundario }]}>{c.valor}</Text>
            </View>
            {c.editable ? <Ionicons name="chevron-forward" size={18} color={colores.secundario} /> : <Ionicons name="lock-closed-outline" size={16} color={colores.secundario} />}
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalFondo} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Editar {campoActual?.etiqueta}</Text>
            <TextInput
              style={[styles.modalInput, { color: colores.textoCampo, backgroundColor: colores.campo, borderColor: colores.linea }]}
              value={valorEdicion}
              onChangeText={setValorEdicion}
              keyboardType={campoActual?.teclado || "default"}
              autoFocus
            />
            <View style={styles.modalBotones}>
              <Pressable style={[styles.boton, { borderColor: colores.linea, borderWidth: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colores.secundario, fontWeight: "600" }}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.boton, { backgroundColor: colores.primario }]} onPress={guardarCambio} disabled={guardando}>
                {guardando ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Guardar</Text>}
              </Pressable>
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  etiqueta: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtexto: {
    fontSize: 13,
    marginTop: 2,
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
    gap: 12,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  modalBotones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  boton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
