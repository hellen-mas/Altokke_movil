import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import {
  DireccionGuardada,
  pasajeroService,
} from "@/features/pasajeros/services/pasajeroService";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

const ICONOS: { id: string; nombre: keyof typeof Ionicons.glyphMap; etiqueta: string }[] = [
  { id: "home", nombre: "home-outline", etiqueta: "Casa" },
  { id: "trabajo", nombre: "briefcase-outline", etiqueta: "Trabajo" },
  { id: "estudio", nombre: "school-outline", etiqueta: "Estudios" },
  { id: "gym", nombre: "fitness-outline", etiqueta: "Gimnasio" },
  { id: "corazon", nombre: "heart-outline", etiqueta: "Favorito" },
  { id: "ubicacion", nombre: "location-outline", etiqueta: "Punto" },
];

const DEFAULT_DIRS: DireccionGuardada[] = [
  { id: "casa-default", nombre: "Casa", direccion: "Jr. Amazonas 320, Bagua", icono: "home-outline", coordenadas: { latitude: -5.638, longitude: -78.531 } },
  { id: "trabajo-default", nombre: "Trabajo", direccion: "Av. Héroes del Cenepa 450, Bagua", icono: "briefcase-outline", coordenadas: { latitude: -5.642, longitude: -78.527 } },
];

export default function DireccionesGuardadas() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { perfil, recargar } = usePerfilPasajero();
  const { setDestino } = useViaje();

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [icono, setIcono] = useState<keyof typeof Ionicons.glyphMap>("home-outline");
  const [guardando, setGuardando] = useState(false);

  const lista = (perfil?.preferencias?.direcciones?.length ?? 0) > 0 ? perfil!.preferencias.direcciones! : DEFAULT_DIRS;

  const guardar = async () => {
    if (!nombre.trim() || !direccion.trim()) {
      Alert.alert("Campos requeridos", "Por favor ingresa un nombre y una dirección.");
      return;
    }
    if (!userId) return;

    try {
      setGuardando(true);
      await pasajeroService.guardarDireccion(userId, {
        id: `dir-${Date.now()}`,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        icono,
        coordenadas: { latitude: -5.6389, longitude: -78.5302 },
      });
      await recargar();
      setModalVisible(false);
    } catch {
      Alert.alert("Error", "No se pudo guardar la dirección.");
    } finally {
      setGuardando(false);
    }
  };

  const opciones = (lugar: DireccionGuardada) => {
    Alert.alert(lugar.nombre, lugar.direccion, [
      {
        text: "Pedir viaje hacia aquí",
        onPress: () => {
          setDestino({
            id: lugar.id,
            nombre: lugar.nombre,
            detalle: lugar.direccion,
            coordenadas: lugar.coordenadas || { latitude: -5.6389, longitude: -78.5302 },
          });
          router.push("/confirmar-viaje");
        },
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          if (!userId) return;
          await pasajeroService.eliminarDireccion(userId, lugar.id);
          await recargar();
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Direcciones guardadas" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {lista.map((lugar) => (
          <Pressable
            key={lugar.id}
            style={[styles.item, { borderBottomColor: colores.linea }]}
            onPress={() => opciones(lugar)}
          >
            <View style={[styles.iconoBox, { backgroundColor: colores.campo }]}>
              <Ionicons name={(lugar.icono as any) || "location-outline"} size={22} color={colores.primario} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.titulo, { color: colores.texto }]}>{lugar.nombre}</Text>
              <Text style={[styles.desc, { color: colores.secundario }]}>{lugar.direccion}</Text>
            </View>
            <Ionicons name="ellipsis-vertical" size={18} color={colores.secundario} />
          </Pressable>
        ))}

        <Pressable
          style={[styles.botonNuevo, { borderColor: colores.exitoTexto }]}
          onPress={() => {
            setNombre("");
            setDireccion("");
            setIcono("home-outline");
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color={colores.exitoTexto} />
          <Text style={[styles.nuevoTexto, { color: colores.exitoTexto }]}>Agregar nueva dirección</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalBox, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Nueva dirección</Text>
            <TextInput
              style={[styles.input, { color: colores.textoCampo, backgroundColor: colores.campo, borderColor: colores.linea }]}
              placeholder="Nombre (ej. Casa, Universidad)"
              placeholderTextColor={colores.secundario}
              value={nombre}
              onChangeText={setNombre}
            />
            <TextInput
              style={[styles.input, { color: colores.textoCampo, backgroundColor: colores.campo, borderColor: colores.linea }]}
              placeholder="Dirección o referencia exacta"
              placeholderTextColor={colores.secundario}
              value={direccion}
              onChangeText={setDireccion}
            />

            <View style={styles.iconosRow}>
              {ICONOS.map((ico) => {
                const sel = icono === ico.nombre;
                return (
                  <Pressable
                    key={ico.id}
                    style={[styles.icoBtn, { backgroundColor: sel ? colores.primario : colores.campo, borderColor: sel ? colores.primario : colores.linea }]}
                    onPress={() => setIcono(ico.nombre)}
                  >
                    <Ionicons name={ico.nombre} size={20} color={sel ? "#FFFFFF" : colores.texto} />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalAcciones}>
              <Pressable style={[styles.btnAccion, { borderColor: colores.linea, borderWidth: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colores.secundario, fontWeight: "600" }}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btnAccion, { backgroundColor: colores.primario }]} onPress={guardar} disabled={guardando}>
                {guardando ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Guardar</Text>}
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
  scroll: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  item: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  iconoBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
  },
  desc: {
    fontSize: 13,
  },
  botonNuevo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 12,
  },
  nuevoTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "800",
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  iconosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  icoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAcciones: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  btnAccion: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
