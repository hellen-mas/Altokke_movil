import { Ionicons } from "@expo/vector-icons";
import React from "react";
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
import MapView, { Marker } from "react-native-maps";
import {
  BarraSuperiorNavegacion,
  TarjetaDireccion,
} from "@/shared/components/ui";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { CENTRO_BAGUA } from "@/features/viajes/constants/pasajero";
import {
  useDireccionesGuardadas,
  ICONOS_DISPONIBLES,
} from "@/features/pasajeros/hooks/useDireccionesGuardadas";
import type { DireccionGuardada } from "@/features/pasajeros/services/pasajeroService";

export default function DireccionesGuardadas() {
  const { colores } = useAltokkeTheme();

  const {
    direccionesGuardadas,
    modalVisible,
    nombre,
    setNombre,
    direccion,
    setDireccion,
    iconoSeleccionado,
    setIconoSeleccionado,
    guardando,
    coordenadasSeleccionadas,
    buscandoDireccion,
    buscandoUbicacion,
    mapaRef,
    abrirModalAgregar,
    cerrarModalAgregar,
    seleccionarUbicacionEnMapa,
    buscarDireccionTexto,
    guardarDireccion,
    pedirViajeHacia,
    eliminarDireccion,
  } = useDireccionesGuardadas();

  const opcionesDireccion = (lugar: DireccionGuardada) => {
    Alert.alert(lugar.nombre, lugar.direccion, [
      {
        text: "Pedir viaje hacia aquí",
        onPress: () => pedirViajeHacia(lugar),
      },
      {
        text: "Eliminar dirección",
        style: "destructive",
        onPress: () => eliminarDireccion(lugar.id),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <BarraSuperiorNavegacion titulo="Mis direcciones" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <Text style={[styles.descripcionPantalla, { color: colores.secundario }]}>
          Guarda tus lugares frecuentes para llegar más rápido.
        </Text>

        {direccionesGuardadas.length === 0 ? (
          <View style={styles.estadoVacio}>
            <View
              style={[
                styles.iconoVacio,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={30}
                color={colores.exitoTexto}
              />
            </View>
            <Text style={[styles.vacioTitulo, { color: colores.texto }]}>
              Aún no tienes direcciones
            </Text>
            <Text
              style={[
                styles.vacioDescripcion,
                { color: colores.secundario },
              ]}
            >
              Agrega tu casa, trabajo o cualquier lugar al que viajes con frecuencia.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.listaDirecciones,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            {direccionesGuardadas.map((lugar, index) => (
              <TarjetaDireccion
                key={lugar.id}
                nombre={lugar.nombre}
                direccion={lugar.direccion}
                icono={
                  (lugar.icono as keyof typeof Ionicons.glyphMap) ||
                  "location-outline"
                }
                onPress={() => opcionesDireccion(lugar)}
                mostrarSeparador={index !== direccionesGuardadas.length - 1}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={abrirModalAgregar}
          accessibilityRole="button"
          accessibilityLabel="Agregar nueva dirección"
          style={({ pressed }) => [
            styles.botonAgregar,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
            pressed && { backgroundColor: colores.campo },
          ]}
        >
          <Ionicons name="add-circle" size={24} color={colores.exitoTexto} />
          <Text style={[styles.textoBotonAgregar, { color: colores.texto }]}>
            Agregar dirección
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalAgregar}
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
              Nueva dirección
            </Text>

            <TextInput
              style={[
                styles.inputModal,
                {
                  color: colores.textoCampo,
                  backgroundColor: colores.campo,
                  borderColor: colores.linea,
                },
              ]}
              placeholder="Nombre (ej. Casa, Universidad, Trabajo)"
              placeholderTextColor={colores.secundario}
              value={nombre}
              onChangeText={setNombre}
            />

            <TextInput
              style={[
                styles.inputModal,
                {
                  color: colores.textoCampo,
                  backgroundColor: colores.campo,
                  borderColor: colores.linea,
                },
              ]}
              placeholder="Dirección o referencia exacta"
              placeholderTextColor={colores.secundario}
              value={direccion}
              onChangeText={setDireccion}
            />

            <Pressable
              onPress={buscarDireccionTexto}
              disabled={buscandoUbicacion || guardando}
              style={[
                styles.botonBuscarDireccion,
                {
                  backgroundColor: colores.exitoFondo,
                  opacity: buscandoUbicacion ? 0.6 : 1,
                },
              ]}
            >
              {buscandoUbicacion ? (
                <ActivityIndicator size="small" color={colores.exitoTexto} />
              ) : (
                <Ionicons
                  name="search-outline"
                  size={19}
                  color={colores.exitoTexto}
                />
              )}
              <Text style={{ color: colores.exitoTexto, fontWeight: "700" }}>
                {buscandoUbicacion
                  ? "Buscando ubicación..."
                  : "Buscar dirección en el mapa"}
              </Text>
            </Pressable>

            {buscandoDireccion && (
              <Text style={{ color: colores.secundario, fontSize: 12 }}>
                Buscando la dirección del punto seleccionado...
              </Text>
            )}

            <Text style={[styles.etiquetaIconos, { color: colores.texto }]}>
              Marca tu ubicación exacta:
            </Text>

            <MapView
              ref={mapaRef}
              style={styles.mapaDireccion}
              initialRegion={{
                latitude: CENTRO_BAGUA.latitude,
                longitude: CENTRO_BAGUA.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              onPress={(evento) => {
                seleccionarUbicacionEnMapa(evento.nativeEvent.coordinate);
              }}
            >
              {coordenadasSeleccionadas && (
                <Marker
                  coordinate={coordenadasSeleccionadas}
                  title={nombre.trim() || "Mi dirección"}
                  pinColor="green"
                />
              )}
            </MapView>

            <Text
              style={{
                color: coordenadasSeleccionadas
                  ? colores.exitoTexto
                  : colores.secundario,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {coordenadasSeleccionadas
                ? "Ubicación seleccionada. Toca otro punto para cambiarla."
                : "Toca el mapa para seleccionar tu ubicación."}
            </Text>

            <Text style={[styles.etiquetaIconos, { color: colores.texto }]}>
              Selecciona un ícono:
            </Text>
            <View style={styles.grillaIconos}>
              {ICONOS_DISPONIBLES.map((ico) => {
                const seleccionado = iconoSeleccionado === ico.nombre;
                return (
                  <Pressable
                    key={ico.id}
                    style={[
                      styles.opcionIcono,
                      {
                        backgroundColor: seleccionado
                          ? colores.primario
                          : colores.campo,
                        borderColor: seleccionado
                          ? colores.primario
                          : colores.linea,
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
                style={[
                  styles.botonModal,
                  { borderColor: colores.linea, borderWidth: 1 },
                ]}
                onPress={cerrarModalAgregar}
                disabled={guardando}
              >
                <Text
                  style={[
                    styles.botonTextoSecundario,
                    { color: colores.secundario },
                  ]}
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.botonModal,
                  { backgroundColor: colores.primario },
                ]}
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
  container: { flex: 1 },
  contenido: { paddingHorizontal: 20, paddingBottom: 30 },
  descripcionPantalla: { fontSize: 13, lineHeight: 18, marginTop: 16, marginBottom: 16 },
  estadoVacio: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },
  iconoVacio: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  vacioTitulo: { fontSize: 16, fontWeight: "700" },
  vacioDescripcion: { fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 18 },
  listaDirecciones: { borderWidth: 1, borderRadius: 18, overflow: "hidden", marginBottom: 16 },
  botonAgregar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  textoBotonAgregar: { fontSize: 14, fontWeight: "700" },
  modalFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 },
  modalCaja: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 10 },
  modalTitulo: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  inputModal: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  botonBuscarDireccion: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  etiquetaIconos: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  mapaDireccion: { width: "100%", height: 140, borderRadius: 12 },
  grillaIconos: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  opcionIcono: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalBotones: { flexDirection: "row", gap: 10, marginTop: 8 },
  botonModal: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  botonTextoSecundario: { fontSize: 14, fontWeight: "600" },
  botonTextoPrimario: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
