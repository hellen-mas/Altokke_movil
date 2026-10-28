import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
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
import MapView, { Marker } from "react-native-maps";
import type { PuntoMapa } from "@/features/viajes/types/tiposMapa";
import { CENTRO_BAGUA } from "@/features/viajes/constants/pasajero";
import * as Location from "expo-location";

const ICONOS_DISPONIBLES: {
  id: string;
  nombre: keyof typeof Ionicons.glyphMap;
  etiqueta: string;
}[] = [
  { id: "home", nombre: "home-outline", etiqueta: "Casa" },
  { id: "trabajo", nombre: "briefcase-outline", etiqueta: "Trabajo" },
  { id: "estudio", nombre: "school-outline", etiqueta: "Estudios" },
  { id: "gym", nombre: "fitness-outline", etiqueta: "Gimnasio" },
  { id: "corazon", nombre: "heart-outline", etiqueta: "Favorito" },
  { id: "ubicacion", nombre: "location-outline", etiqueta: "Punto" },
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
  const [coordenadasSeleccionadas, setCoordenadasSeleccionadas] = useState<PuntoMapa | null>(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const consultaDireccionRef = useRef(0);
  const direccionEditadaRef = useRef(false);
  const mapaRef = useRef<MapView | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);

  useEffect(() => {
    return () => {
      consultaDireccionRef.current += 1;
    };
  }, []);

  const direccionesGuardadas = perfil?.preferencias?.direcciones ?? [];

  const abrirModalAgregar = () => {
    setNombre("");
    setDireccion("");
    setIconoSeleccionado("home-outline");
    setCoordenadasSeleccionadas(null);
    setModalVisible(true);
    consultaDireccionRef.current += 1;
    direccionEditadaRef.current = false;
    setBuscandoDireccion(false);
  };

  const cerrarModalAgregar = () => {
    consultaDireccionRef.current += 1;
    setBuscandoDireccion(false);
    setModalVisible(false);
  };
  
  const seleccionarUbicacion = async (punto: PuntoMapa) => {
    setCoordenadasSeleccionadas(punto);
    const numeroConsulta = ++consultaDireccionRef.current;

    direccionEditadaRef.current = false;
    setBuscandoDireccion(true);
    setDireccion("");

    try {
      const resultados = await Location.reverseGeocodeAsync(punto);

      // Ignorar resultados de puntos anteriores o de un modal cerrado.
      if (
        numeroConsulta !== consultaDireccionRef.current ||
        direccionEditadaRef.current
      ) {
        return;
      }

      const lugar = resultados[0];
      if (!lugar) {
        return;
      }

      const calle = [lugar.street, lugar.streetNumber]
        .filter(Boolean)
        .join(" ");

      const localidad = lugar.district || lugar.city || lugar.subregion;

      const direccionEncontrada = [calle || lugar.name, localidad]
        .filter(Boolean)
        .join(", ");

      if (direccionEncontrada) {
        setDireccion(direccionEncontrada);
      }
    } catch (error) {
      if (numeroConsulta === consultaDireccionRef.current) {
        console.warn("No se pudo obtener la dirección:", error);
      }
    } finally {
      if (numeroConsulta === consultaDireccionRef.current) {
        setBuscandoDireccion(false);
      }
    }
  };

  const buscarDireccionEnMapa = async () => {
    const texto = direccion.trim();

    if (!texto || buscandoUbicacion || guardando) {
      if (!texto) {
        Alert.alert(
          "Escribe una dirección",
          "Ingresa una calle o referencia para buscarla en el mapa."
        );
      }
      return;
    }

    setBuscandoUbicacion(true);

    // Invalidar cualquier búsqueda inversa anterior.
    const numeroConsulta = ++consultaDireccionRef.current;
    setBuscandoDireccion(false);

    try {
      const resultados = await Location.geocodeAsync(
        `${texto}, Bagua, Amazonas, Perú`
      );

      if (numeroConsulta !== consultaDireccionRef.current) return;

      if (resultados.length === 0) {
        Alert.alert(
          "Dirección no encontrada",
          "No encontramos esa dirección. Intenta escribir una referencia más precisa o marca el punto manualmente."
        );
        return;
      }

      const punto = resultados[0];

      if (
        !Number.isFinite(punto.latitude) ||
        !Number.isFinite(punto.longitude) ||
        Math.abs(punto.latitude) > 90 ||
        Math.abs(punto.longitude) > 180
      ) {
        Alert.alert(
          "Ubicación no válida",
          "No se pudo obtener una ubicación válida para esta dirección."
        );
        return;
      }

      Alert.alert(
        "Ubicación aproximada encontrada",
        "Altokke encontró una posible ubicación. Verifica el marcador en el mapa antes de guardar.",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Mostrar en el mapa",
            onPress: () => {
              const coordenadas = {
                latitude: punto.latitude,
                longitude: punto.longitude,
              };

              // Evitar que una consulta anterior cambie el texto.
              consultaDireccionRef.current += 1;
              direccionEditadaRef.current = true;

              setCoordenadasSeleccionadas(coordenadas);

              mapaRef.current?.animateToRegion(
                {
                  ...coordenadas,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                },
                500
              );
            },
          },
        ]
      );
    } catch (error) {
      console.warn("Error al buscar la dirección:", error);

      Alert.alert(
        "No se pudo buscar",
        "Comprueba tu conexión o selecciona el lugar manualmente en el mapa."
      );
    } finally {
      setBuscandoUbicacion(false);
    }
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

    if (
      !coordenadasSeleccionadas ||
      typeof coordenadasSeleccionadas.latitude !== "number" ||
      typeof coordenadasSeleccionadas.longitude !== "number" ||
      !Number.isFinite(coordenadasSeleccionadas.latitude) ||
      !Number.isFinite(coordenadasSeleccionadas.longitude) ||
      Math.abs(coordenadasSeleccionadas.latitude) > 90 ||
      Math.abs(coordenadasSeleccionadas.longitude) > 180
    ) {
      Alert.alert(
        "Selecciona una ubicación válida",
        "Marca en el mapa el punto exacto de esta dirección."
      );
      return;
    }

    // Invalidar cualquier consulta pendiente antes de guardar.
    consultaDireccionRef.current += 1;
    setBuscandoDireccion(false);

    try {
      setGuardando(true);
      const nueva: DireccionGuardada = {
        id: `dir-${Date.now()}`,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        icono: iconoSeleccionado,
        coordenadas: coordenadasSeleccionadas,
      };

      await pasajeroService.guardarDireccion(userId, nueva);
      await recargar();
      cerrarModalAgregar();

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
          const coordenadas = lugar.coordenadas;

          if (
            !coordenadas ||
            !Number.isFinite(coordenadas.latitude) ||
            !Number.isFinite(coordenadas.longitude) ||
            Math.abs(coordenadas.latitude) > 90 ||
            Math.abs(coordenadas.longitude) > 180
          ) {
            Alert.alert(
              "Ubicación no definida", 
              "Esta dirección todavía no tiene un punto exacato en el mapa. Selecciona su ubicación antes de solicitar un mototaxi.",
              [
                {
                  text: "Seleccionar ubicación",
                  onPress: () => router.push("/destino"),
                },
                {
                  text: "Cancelar",
                  style: "cancel",
                },
              ]
            );

            return;
          }

          setDestino({
            id: lugar.id,
            nombre: lugar.nombre,
            detalle: lugar.direccion,
            coordenadas,
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
          } catch {
            Alert.alert("Aviso", "No se pudo eliminar la dirección.");
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Mis direcciones" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >

        <Text
          style={[
            styles.descripcionPantalla,
            { color: colores.secundario },
          ]}
        >
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
              Agrega tu casa, trabajo o cualquier lugar al que viajes
              con frecuencia.
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
              <View key={lugar.id}>
                <Pressable
                  onPress={() => opcionesDireccion(lugar)}
                  accessibilityRole="button"
                  accessibilityLabel={`Opciones para ${lugar.nombre}`}
                  style={({ pressed }) => [
                    styles.filaDireccion,
                    pressed && {
                      backgroundColor: colores.campo,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconoFondo,
                      { backgroundColor: colores.exitoFondo },
                    ]}
                  >
                    <Ionicons
                      name={
                        (lugar.icono as keyof typeof Ionicons.glyphMap) ||
                        "location-outline"
                      }
                      size={22}
                      color={colores.exitoTexto}
                    />
                  </View>

                  <View style={styles.textos}>
                    <Text
                      style={[styles.nombre, { color: colores.texto }]}
                      numberOfLines={1}
                    >
                      {lugar.nombre}
                    </Text>

                    <Text
                      style={[
                        styles.direccion,
                        { color: colores.secundario },
                      ]}
                      numberOfLines={2}
                    >
                      {lugar.direccion}
                    </Text>
                  </View>

                  <Ionicons
                    name="ellipsis-horizontal"
                    size={22}
                    color={colores.secundario}
                  />
                </Pressable>

                {index !== direccionesGuardadas.length - 1 && (
                  <View
                    style={[
                      styles.separadorDireccion,
                      { backgroundColor: colores.linea },
                    ]}
                  />
                )}
              </View>
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
              backgroundColor: pressed
                ? colores.primarioPresionado
                : colores.primario,
            },
          ]}
        >
          <Ionicons name="add" size={21} color={colores.textoBoton} />

          <Text style={styles.textoBotonAgregar}>
            Agregar dirección
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal Agregar Dirección */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalAgregar}
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
              onChangeText={(texto) => {
                consultaDireccionRef.current += 1;
                direccionEditadaRef.current = true;
                setDireccion(texto);
                setCoordenadasSeleccionadas(null);
              }}
            />

            <Pressable
              onPress={() => void buscarDireccionEnMapa()}
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
              <Text style={{ color: colores.secundario, fontSize: 12 }}>Buscando la dirección del punto seleccionado...</Text>
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
                const punto = evento.nativeEvent.coordinate;

                void seleccionarUbicacion({
                  latitude: punto.latitude,
                  longitude: punto.longitude,
                });
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
                marginTop: 4,
              }}
            >
              {coordenadasSeleccionadas
                ? "Ubicación seleccionada. Toca otro punto para cambiarla."
                : "Toca el mapa para seleccionar tu ubicación."}
            </Text>

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
                onPress={cerrarModalAgregar}
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

  mapaDireccion: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
  },

  botonBuscarDireccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  
  descripcionPantalla: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 18,
    marginBottom: 22,
  },

  listaDirecciones: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },

  filaDireccion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  separadorDireccion: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
    marginRight: 16,
  },

  botonAgregar: {
    minHeight: 50,
    backgroundColor: "#83D5AA",
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },

  textoBotonAgregar: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0C211C",
  },

  estadoVacio: {
    alignItems: "center",
    paddingVertical: 38,
    paddingHorizontal: 20,
  },

  iconoVacio: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  vacioTitulo: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  vacioDescripcion: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

});
