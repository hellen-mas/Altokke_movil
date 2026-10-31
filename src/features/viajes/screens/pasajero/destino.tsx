
import { CabeceraFlujoViaje } from "@/features/viajes/components/CabeceraFlujoViaje";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import { BotonPrincipal } from "@/shared/components/ui/BotonPrincipal";
import {
  Lugar,
  LUGARES_BAGUA,
  ORIGEN_EJEMPLO,
} from "@/features/viajes/constants/pasajero";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import type { PuntoMapa } from "../../types/tiposMapa";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PanelDeslizableViaje } from "@/features/viajes/components/PanelDeslizableViaje";

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function filtrarLugares(busqueda: string, listaBase: Lugar[]) {
  const termino = normalizar(busqueda);

  if (!termino) return listaBase;

  return listaBase.filter(
    (lugar) =>
      normalizar(lugar.nombre).includes(termino) ||
      normalizar(lugar.detalle).includes(termino),
  );
}

export default function PantallaDestino() {
  const { colores } = useAltokkeTheme();
  const { origen, setOrigen, destino, setDestino } = useViaje();
  const origenInicialRef = useRef(origen.id);
  const { perfil } = usePerfilPasajero();
  const [busqueda, setBusqueda] = useState(destino?.nombre ?? "");
  const [editandoOrigen, setEditandoOrigen] = useState(false);
  const [busquedaOrigen, setBusquedaOrigen] = useState("");
  const panelRef = useRef<BottomSheet>(null);
  const expandirPanel = () => {
    panelRef.current?.snapToIndex(2);
  };

  // Obtener la ubicación real del pasajero
  useEffect(() => {
    if (origenInicialRef.current !== ORIGEN_EJEMPLO.id) return;

    let activo = true;

    const obtenerUbicacion = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || !activo) return;

        const ubicacion = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!activo) return;

        const coordenadas = {
          latitude: ubicacion.coords.latitude,
          longitude: ubicacion.coords.longitude,
        };

        setOrigen((anterior) => 
          anterior.id === ORIGEN_EJEMPLO.id
            ? {
                id: "ubicacion-actual",
                nombre: "Ubicación actual",
                detalle: "Obteniendo dirección...",
                coordenadas,
              }
            : anterior
        );

        try {
          const direcciones = await Location.reverseGeocodeAsync(coordenadas);
          if (!activo) return;

          const direccion = direcciones[0];

          const calle = direccion?.street?.trim();
          const numero = direccion?.streetNumber?.trim();
          const ciudad = direccion?.city || direccion?.subregion || "Bagua";
          const region = direccion?.region || "Amazonas";

          const nombreDireccion = calle 
            ? `${calle}${numero ? `${numero}` : ""}`
            : direccion?.name || "Ubicación actual";

          setOrigen((anterior) =>
            anterior.id === "ubicacion-actual" &&
            anterior.coordenadas.latitude === coordenadas.latitude &&
            anterior.coordenadas.longitude === coordenadas.longitude
              ? {
                  ...anterior,
                  nombre: nombreDireccion,
                  detalle: `${ciudad}, ${region}`,
                }
              : anterior
          );
        } catch (error) {
          console.warn("Error de geocodificación:", error);
          if (!activo) return;

          setOrigen((anterior) =>
            anterior.id === "ubicacion-actual"
              ? {
                  ...anterior,
                  detalle: "Coordenadas GPS obtenidas",
                }
              : anterior
          );
        }
      } catch (error) {
        console.warn("No se pudo obtener la ubicación GPS:", error);
      }
    };

    void obtenerUbicacion();

    return () => {
      activo = false;
    };
  }, [setOrigen]);

  const listaLugares = useMemo(() => {
    const guardadas: Lugar[] = (
      perfil?.preferencias?.direcciones || []
    )
      .filter(
        (d) => 
          d.coordenadas &&
          Number.isFinite(d.coordenadas.latitude) && 
          Number.isFinite(d.coordenadas.longitude)
      )
      .map((d) => ({
        id: d.id,
        nombre: d.nombre,
        detalle: d.direccion,
        coordenadas: {
          latitude: d.coordenadas!.latitude,
          longitude: d.coordenadas!.longitude,
        },
    }));

    const nombresExistentes = new Set(guardadas.map((g) => g.nombre.toLowerCase()));
    const unicos = LUGARES_BAGUA.filter((l) => !nombresExistentes.has(l.nombre.toLowerCase()));
    return [...guardadas, ...unicos];
  }, [perfil]);

  // Si ya hay un destino elegido, se muestra la lista completa para poder cambiarlo
  const resultados = editandoOrigen
    ? filtrarLugares(busquedaOrigen, listaLugares)
    : destino && destino.nombre === busqueda
      ? listaLugares
      : filtrarLugares(busqueda, listaLugares);

  const cambiarBusqueda = (texto: string) => {
    setBusqueda(texto);

    if (destino && texto !== destino.nombre) {
      setDestino(null);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setDestino(null);
  };

  const seleccionarLugar = (lugar: Lugar) => {
    if (editandoOrigen) {
      setOrigen(lugar);
      setEditandoOrigen(false);
      setBusquedaOrigen("");
    } else {
      setDestino(lugar);
      setBusqueda(lugar.nombre);
    }
    
    Keyboard.dismiss();
    expandirPanel();
  };

  const seleccionarPuntoMapa = (coordenadas: PuntoMapa) => {
    const seleccionarOrigen = editandoOrigen;

    Keyboard.dismiss();

    const coordenadasTexto =
      `${coordenadas.latitude.toFixed(6)}, ` +
      `${coordenadas.longitude.toFixed(6)}`;

    Alert.alert(
      seleccionarOrigen ? "Seleccionar punto de recojo" : "Seleccionar destino",
      `Ubicación seleccionada:\n${coordenadasTexto}\n\n¿Deseas utilizar este punto?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: () => {
            const lugarSeleccionado: Lugar = {
              id: `mapa-${Date.now()}`,
              nombre: "Punto seleccionado en el mapa",
              detalle: coordenadasTexto,
              coordenadas,
            };

            // Guardar inmediatamente las coordenadas elegidas.
            if (seleccionarOrigen) {
              setOrigen(lugarSeleccionado);
              setEditandoOrigen(false);
              setBusquedaOrigen("");
            } else {
              setDestino(lugarSeleccionado);
              setBusqueda(lugarSeleccionado.nombre);
            }

            // Consultar el nombre de la calle sin bloquear la selección.
            const obtenerNombreDireccion = async () => {
              try {
                const direcciones =
                  await Location.reverseGeocodeAsync(coordenadas);

                const direccion = direcciones[0];
                if (!direccion) return;

                const calle = direccion.street?.trim();
                const numero = direccion.streetNumber?.trim();

                const nombre =
                  (calle
                    ? `${calle}${numero ? ` ${numero}` : ""}`
                    : direccion.name?.trim()) ||
                  "Punto seleccionado en el mapa";

                const detalle =
                  [direccion.city || direccion.subregion, direccion.region]
                    .filter(Boolean)
                    .join(", ") || coordenadasTexto;

                const actualizarLugar = (anterior: Lugar): Lugar =>
                  anterior.id === lugarSeleccionado.id
                    ? { ...anterior, nombre, detalle }
                    : anterior;

                if (seleccionarOrigen) {
                  setOrigen(actualizarLugar);
                } else {
                  setDestino((anterior) =>
                    anterior ? actualizarLugar(anterior) : anterior
                  );

                  setBusqueda((anterior) =>
                    anterior === lugarSeleccionado.nombre
                      ? nombre
                      : anterior
                  );
                }
              } catch (error) {
                console.warn(
                  "No se pudo obtener la dirección del punto:",
                  error
                );
              }
            };

            void obtenerNombreDireccion();
          },
        },
      ]
    );
  };

  const intercambiarLugares = () => {
    if (!destino) {
      Alert.alert(
        "Selecciona un destino",
        "Primero debes elegir un destino para intercambiar las ubicaciones."
      );
      return;
    }

    if (origen.id === ORIGEN_EJEMPLO.id) {
      Alert.alert(
        "Ubicación pendiente",
        "Espera a que obtengamos tu ubicación GPS antes de intercambiar los lugares."
      );
      return;
    }

    const origenAnterior = origen;
    const destinoAnterior = destino;

    setOrigen(destinoAnterior);
    setDestino(origenAnterior);
    setBusqueda(origenAnterior.nombre);

    Keyboard.dismiss();
  };

  const confirmarDestino = () => {
    router.push("/confirmar-viaje");
  };

  return (
    <GestureHandlerRootView
      style={[
        styles.pantalla,
        { backgroundColor: colores.fondo },
      ]}
    >
      <CabeceraFlujoViaje
        titulo="Seleccionar destino"
        subtitulo="Busca un lugar o selecciónalo en el mapa"
      />

      <View style={styles.zonaMapa}>
        <MapaBase
          centro={origen.coordenadas}
          origen={origen.coordenadas}
          destino={destino?.coordenadas}
          margenInferior={0}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onSeleccionarPunto={(coordenadas) => {
            void seleccionarPuntoMapa(coordenadas);
          }}
        />

        {/* Panel deeslizable del mapa */}
        <PanelDeslizableViaje
          referencia={panelRef}
          posicionInicial={1}
          footer={destino && !editandoOrigen ? (
            <View style={[styles.pie, { backgroundColor: colores.superficie, borderTopColor: colores.linea }]}>
              <BotonPrincipal
                titulo="Confirmar destino"
                mostrarIcono
                icono="arrow-forward"
                onPress={confirmarDestino}
              />
            </View>
          ) : undefined}
        >
          <BottomSheetScrollView
            style={styles.listaDeslizable}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.contenidoPanel,
              { paddingBottom: destino && !editandoOrigen ? 112 : 24 },
            ]}
          >
            <View style={styles.ayudaMapa}>
              <Ionicons
                name="finger-print-outline"
                size={15}
                color={colores.secundario}
              />
              <Text style={[styles.ayudaMapaTexto, { color: colores.secundario }]}>
                Mantén presionado el mapa para elegir {editandoOrigen ? "tu punto de recojo" : "un destino"}
              </Text>
            </View>

            {/* Origen */}
              <View
                style={[
                  styles.filaOrigen,
                  {
                    backgroundColor: colores.campo,
                    borderColor: colores.linea,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconoOrigen,
                    { backgroundColor: colores.exitoFondo },
                  ]}
                >
                  <Ionicons
                    name="radio-button-on"
                    size={20}
                    color={colores.exitoTexto}
                  />
                </View>

                <View style={styles.textoOrigen}>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    PUNTO DE RECOJO
                  </Text>

                  {editandoOrigen ? (
                    <BottomSheetTextInput
                      value={busquedaOrigen}
                      onFocus={expandirPanel}
                      onChangeText={setBusquedaOrigen}
                      placeholder="Buscar punto de recojo..."
                      placeholderTextColor={colores.secundario}
                      style={[styles.origenNombre, { color: colores.texto }]}
                      autoFocus
                      autoCorrect={false}
                      returnKeyType="search"
                    />
                  ) : (
                    <Pressable
                      onPress={() => {
                        setEditandoOrigen(true);
                        setBusquedaOrigen("");
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Editar origen"
                    >
                      <Text
                        style={[styles.origenNombre, { color: colores.texto }]}
                        numberOfLines={1}
                      >
                        {origen.nombre}
                      </Text>
                      <Text
                        style={[styles.etiqueta, { color: colores.secundario }]}
                        numberOfLines={1}
                      >
                        {origen.detalle}
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  onPress={intercambiarLugares}
                  accessibilityRole="button"
                  accessibilityLabel="Intercambiar origen y destino"
                  style={({ pressed }) => [
                    styles.botonIntercambio,
                    { 
                      backgroundColor: pressed
                        ? colores.exitoFondo
                        : colores.superficie,
                    },
                  ]}
                >
                  <Ionicons
                    name="swap-vertical"
                    size={20}
                    color={colores.exitoTexto}
                  />
                </Pressable>
              </View>

              {/* Destino */}
              <View
                style={[
                  styles.campoDestino,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.primario,
                  },
                ]}
              >
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={colores.exitoTexto}
                />

                <View style={styles.campoDestinoTexto}>
                  <Text style={[styles.etiqueta, { color: colores.secundario }]}>
                    DESTINO
                  </Text>
                  <BottomSheetTextInput
                    value={busqueda}
                    onFocus={expandirPanel}
                    onChangeText={(texto) => {
                      if (editandoOrigen) {
                        setEditandoOrigen(false);
                        setBusquedaOrigen("");
                      }

                      cambiarBusqueda(texto);
                    }}
                    placeholder={"¿A dónde vamos?"}
                    placeholderTextColor={colores.secundario}
                    style={[styles.input, { color: colores.texto }]}
                    autoCorrect={false}
                  />
                </View>

                {busqueda.length > 0 && (
                  <Pressable onPress={limpiarBusqueda} hitSlop={10}>
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colores.secundario}
                    />
                  </Pressable>
                )}
              </View>
              <Text
                style={[
                  styles.etiqueta,
                  {
                    color: colores.secundario,
                    marginTop: 18,
                    marginBottom: 4,
                    fontWeight: "800",
                  },
                ]}
              >
                {editandoOrigen
                  ? "Lugares para recogerme"
                  : "Lugares sugeridos"}
              </Text>

              {/* Sugerencias */}
              <View style={styles.lista}>
                {resultados.length === 0 && (
                  <Text style={[styles.sinResultados, { color: colores.secundario }]}>
                    No encontramos lugares con “{editandoOrigen ? busquedaOrigen : busqueda}”.
                  </Text>
                )}

                {resultados.map((lugar) => {
                  const elegido = editandoOrigen 
                    ? lugar.id === origen.id
                    : lugar.id === destino?.id;

                  return (
                    <Pressable
                      key={lugar.id}
                      onPress={() => seleccionarLugar(lugar)}
                      style={({ pressed }) => [
                        styles.lugar,
                        (pressed || elegido) && {
                          backgroundColor: colores.exitoFondo,
                        },
                      ]}
                    >
                      <Ionicons
                        name="location-sharp"
                        size={20}
                        color={elegido ? colores.exitoTexto : colores.secundario}
                      />

                      <View style={styles.lugarTextos}>
                        <Text style={[styles.lugarNombre, { color: colores.texto }]}>
                          {lugar.nombre}
                        </Text>
                        <Text
                          style={[
                            styles.lugarDetalle,
                            { color: colores.secundario },
                          ]}
                        >
                          {lugar.detalle}
                        </Text>
                      </View>

                      <Ionicons
                        name={elegido ? "checkmark-circle" : "chevron-forward"}
                        size={elegido ? 22 : 18}
                        color={elegido ? colores.exitoTexto : colores.secundario}
                      />
                    </Pressable>
                  );
                })}
              </View>
          </BottomSheetScrollView>
        </PanelDeslizableViaje>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  zonaMapa: {
    flex: 1,
    position: "relative",
  },

  contenidoPanel: {
    paddingHorizontal: 16,
    paddingBottom: 2,
  },

  listaDeslizable: {
    flex: 1,
  },

  filaOrigen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    minHeight: 76,
    borderRadius: 18,
    borderWidth: 1,
  },

  iconoOrigen: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  textoOrigen: {
    flex: 1,
    gap: 3,
  },

  etiqueta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  origenNombre: {
    fontSize: 15,
    fontWeight: "700",
  },

  botonIntercambio: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  campoDestino: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1.5,
  },

  campoDestinoTexto: {
    flex: 1,
    gap: 3,
  },

  input: {
    paddingVertical: 3,
    fontSize: 16,
    fontWeight: "600",
  },

  pie: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
  },

  lista: {
    paddingTop: 6,
    paddingBottom: 10,
  },

  sinResultados: {
    paddingVertical: 24,
    textAlign: "center",
    fontSize: 14,
  },

  lugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    minHeight: 64,
  },

  lugarTextos: {
    flex: 1,
    gap: 3,
  },

  lugarNombre: {
    fontSize: 15,
    fontWeight: "700",
  },

  lugarDetalle: {
    fontSize: 12,
    lineHeight: 17,
  },

  ayudaMapa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },

  ayudaMapaTexto: {
    fontSize: 11,
    flexShrink: 1,
  },

});
