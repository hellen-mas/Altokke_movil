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
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import {
  DireccionGuardada,
  pasajeroService,
} from "@/features/pasajeros/services/pasajeroService";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

const ICONOS_DISPONIBLES: Array<{
  id: string;
  nombre: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
}> = [
  { id: "home", nombre: "home-outline", etiqueta: "Casa" },
  { id: "trabajo", nombre: "briefcase-outline", etiqueta: "Trabajo" },
  { id: "estudio", nombre: "school-outline", etiqueta: "Estudios" },
  { id: "gym", nombre: "fitness-outline", etiqueta: "Gimnasio" },
  { id: "corazon", nombre: "heart-outline", etiqueta: "Favorito" },
  { id: "ubicacion", nombre: "location-outline", etiqueta: "Punto" },
];

const DIRECCIONES_PREDETERMINADAS: DireccionGuardada[] = [
  {
    id: "casa-default",
    nombre: "Casa",
    direccion: "Jr. Amazonas 320, Bagua",
    icono: "home-outline",
    coordenadas: { latitude: -5.638, longitude: -78.531 },
  },
  {
    id: "trabajo-default",
    nombre: "Trabajo",
    direccion: "Av. Héroes del Cenepa 450, Bagua",
    icono: "briefcase-outline",
    coordenadas: { latitude: -5.642, longitude: -78.527 },
  },
];

export default function DireccionesGuardadas() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { perfil, recargar } = usePerfilPasajero();
  const { setDestino } = useViaje();

  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [iconoSeleccionado, setIconoSeleccionado] = useState<keyof typeof Ionicons.glyphMap>("home-outline");
  const [guardando, setGuardando] = useState(false);

  const direccionesGuardadas =
    perfil?.preferencias?.direcciones && perfil.preferencias.direcciones.length > 0
      ? perfil.preferencias.direcciones
      : DIRECCIONES_PREDETERMINADAS;

  const abrirModalAgregar = () => {
    setNombre("");
    setDireccion("");
    setIconoSeleccionado("home-outline");
    setModalVisible(true);
  };

  const guardarDireccion = async () => {
    if (!nombre.trim() || !direccion.trim()) {
      Alert.alert("Campos requeridos", "Por favor ingresa un nombre y una dirección.");
      return;
    }

    if (!userId) {
      Alert.alert("Sesión requerida", "Inicia sesión para guardar direcciones en tu cuenta.");
      return;
    }

    try {
      setGuardando(true);
      const nueva: DireccionGuardada = {
        id: `dir-${Date.now()}`,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        icono: iconoSeleccionado,
        coordenadas: { latitude: -5.6389, longitude: -78.5302 },
      };

      await pasajeroService.guardarDireccion(userId, nueva);
      await recargar();
      setModalVisible(false);
      Alert.alert("Éxito", "Dirección guardada correctamente.");
    } catch (err: any) {
      Alert.alert("Error al guardar", err?.message || "No se pudo registrar la dirección.");
    } finally {
      setGuardando(false);
    }
  };

  const opcionesDireccion = (lugar: DireccionGuardada) => {
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
        text: "Eliminar dirección",
        style: "destructive",
        onPress: async () => {
          if (!userId) return;
          try {
            await pasajeroService.eliminarDireccion(userId, lugar.id);
            await recargar();
            Alert.alert("Eliminado", "La dirección fue eliminada.");
          } catch (err: any) {
            Alert.alert("Aviso", "No se pudo eliminar la dirección.");
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Direcciones guardadas" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {direccionesGuardadas.map((lugar) => (
          <Pressable
            key={lugar.id}
            style={({ pressed }) => [
              styles.fila,
              { borderBottomColor: colores.linea },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => opcionesDireccion(lugar)}
            accessibilityRole="button"
          >
            <View style={[styles.iconoFondo, { backgroundColor: colores.campo }]}>
              <Ionicons
                name={(lugar.icono as keyof typeof Ionicons.glyphMap) || "location-outline"}
                size={22}
                color={colores.primario}
              />
            </View>

            <View style={styles.textos}>
              <Text style={[styles.nombre, { color: colores.texto }]}>
                {lugar.nombre}
              </Text>
              <Text style={[styles.direccion, { color: colores.secundario }]}>
                {lugar.direccion}
              </Text>
            </View>

            <Pressable hitSlop={10} onPress={() => opcionesDireccion(lugar)}>
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={colores.secundario}
              />
            </Pressable>
          </Pressable>
        ))}

        <Pressable
          style={[styles.fila, { borderBottomColor: colores.linea }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Agregar nueva dirección"
          onPress={abrirModalAgregar}
        >
          <Ionicons
            name="add-circle"
            size={24}
            color={colores.exitoTexto}
          />
          <Text style={[styles.agregar, { color: colores.exitoTexto }]}>
            Agregar nueva dirección
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal Agregar Dirección */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <Text style={[styles.modalTitulo, { color: colores.texto }]}>Nueva dirección</Text>

            <TextInput
              style={[styles.inputModal, { color: colores.textoCampo, backgroundColor: colores.campo, borderColor: colores.linea }]}
              placeholder="Nombre (ej. Casa, Universidad, Trabajo)"
              placeholderTextColor={colores.secundario}
              value={nombre}
              onChangeText={setNombre}
            />

            <TextInput
              style={[styles.inputModal, { color: colores.textoCampo, backgroundColor: colores.campo, borderColor: colores.linea }]}
              placeholder="Dirección o referencia exacta"
              placeholderTextColor={colores.secundario}
              value={direccion}
              onChangeText={setDireccion}
            />

            <Text style={[styles.etiquetaIconos, { color: colores.texto }]}>Selecciona un ícono:</Text>
            <View style={styles.grillaIconos}>
              {ICONOS_DISPONIBLES.map((ico) => {
                const seleccionado = iconoSeleccionado === ico.nombre;
                return (
                  <Pressable
                    key={ico.id}
                    style={[
                      styles.opcionIcono,
                      {
                        backgroundColor: seleccionado ? colores.primario : colores.campo,
                        borderColor: seleccionado ? colores.primario : colores.linea,
                      },
                    ]}
                    onPress={() => setIconoSeleccionado(ico.nombre)}
                  >
                    <Ionicons
                      name={ico.nombre}
                      size={20}
                      color={seleccionado ? "#FFFFFF" : colores.texto}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalBotones}>
              <Pressable
                style={[styles.botonModal, { borderColor: colores.linea, borderWidth: 1 }]}
                onPress={() => setModalVisible(false)}
                disabled={guardando}
              >
                <Text style={[styles.botonTextoSecundario, { color: colores.secundario }]}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.botonModal, { backgroundColor: colores.primario }]}
                onPress={guardarDireccion}
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
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },

  iconoFondo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textos: {
    flex: 1,
  },

  nombre: {
    fontSize: 15,
    fontWeight: "700",
  },

  direccion: {
    marginTop: 3,
    fontSize: 13,
  },

  agregar: {
    fontSize: 15,
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

  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
  },

  inputModal: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  etiquetaIconos: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  grillaIconos: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },

  opcionIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBotones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
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
});
