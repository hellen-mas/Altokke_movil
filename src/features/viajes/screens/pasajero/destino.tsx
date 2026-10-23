import { BarraInferior } from "@/features/pasajeros/components/BarraInferior";
import { CabeceraPasajero } from "@/features/pasajeros/components/CabeceraPasajero";
import { MapaBase } from "@/features/viajes/components/MapaBase";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import {
  CENTRO_BAGUA,
  Lugar,
  LUGARES_BAGUA,
  ORIGEN_EJEMPLO,
} from "@/features/viajes/constants/pasajero";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

const PANEL_SOBRE_MAPA = 20;

// El mapa ocupa esta parte de la pantalla; con el teclado abierto se encoge
const PROPORCION_MAPA = 0.3;
const ALTO_MAPA_CON_TECLADO = 110;

// Quita tildes y mayúsculas para que "helices" encuentre "Héroes"
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
  const { destino, setDestino } = useViaje();
  const { perfil } = usePerfilPasajero();
  const [busqueda, setBusqueda] = useState(destino?.nombre ?? "");
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const { height: altoPantalla } = useWindowDimensions();

  const listaLugares = useMemo(() => {
    const guardadas: Lugar[] = (perfil?.preferencias?.direcciones || []).map((d) => ({
      id: d.id,
      nombre: d.nombre,
      detalle: d.direccion,
      coordenadas: d.coordenadas || { latitude: -5.6389, longitude: -78.5302 },
    }));

    const nombresExistentes = new Set(guardadas.map((g) => g.nombre.toLowerCase()));
    const unicos = LUGARES_BAGUA.filter((l) => !nombresExistentes.has(l.nombre.toLowerCase()));
    return [...guardadas, ...unicos];
  }, [perfil]);

  useEffect(() => {
    const alMostrar = Keyboard.addListener("keyboardDidShow", () =>
      setTecladoVisible(true),
    );
    const alOcultar = Keyboard.addListener("keyboardDidHide", () =>
      setTecladoVisible(false),
    );

    return () => {
      alMostrar.remove();
      alOcultar.remove();
    };
  }, []);

  const altoMapa = tecladoVisible
    ? ALTO_MAPA_CON_TECLADO
    : Math.round(altoPantalla * PROPORCION_MAPA);

  // Si ya hay un destino elegido, se muestra la lista completa para poder cambiarlo
  const resultados =
    destino && destino.nombre === busqueda
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
    setDestino(lugar);
    setBusqueda(lugar.nombre);
    Keyboard.dismiss();
  };

  const confirmarDestino = () => {
    router.push("/confirmar-viaje");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.pantalla, { backgroundColor: colores.fondo }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <CabeceraPasajero subtitulo="¿A dónde te llevamos hoy?" />

      <MapaBase
        centro={CENTRO_BAGUA}
        origen={ORIGEN_EJEMPLO.coordenadas}
        destino={destino?.coordenadas}
        margenInferior={PANEL_SOBRE_MAPA + 6}
        style={{ height: altoMapa }}
      />

      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        <View style={[styles.asa, { backgroundColor: colores.linea }]} />

        {/* Origen */}
        <View style={[styles.filaOrigen, { backgroundColor: colores.campo }]}>
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
              Origen
            </Text>
            <Text style={[styles.origenNombre, { color: colores.texto }]}>
              {ORIGEN_EJEMPLO.nombre}
            </Text>
          </View>

          <View
            style={[
              styles.botonIntercambio,
              { backgroundColor: colores.superficie },
            ]}
          >
            <Ionicons
              name="swap-vertical"
              size={18}
              color={colores.secundario}
            />
          </View>
        </View>

        {/* Destino */}
        <View
          style={[
            styles.campoDestino,
            {
              backgroundColor: colores.campo,
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
              Destino
            </Text>
            <TextInput
              value={busqueda}
              onChangeText={cambiarBusqueda}
              placeholder="¿A dónde vamos?"
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

        {/* Sugerencias */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
        >
          {resultados.length === 0 && (
            <Text style={[styles.sinResultados, { color: colores.secundario }]}>
              No encontramos lugares con “{busqueda}”.
            </Text>
          )}

          {resultados.map((lugar) => {
            const elegido = lugar.id === destino?.id;

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
        </ScrollView>

        {destino && (
          <View
            style={[
              styles.pie,
              {
                borderTopColor: colores.linea,
                backgroundColor: colores.superficie,
              },
            ]}
          >
            <BotonPrincipal
              titulo="Confirmar destino"
              onPress={confirmarDestino}
            />
          </View>
        )}
      </View>

      {!tecladoVisible && <BarraInferior activa="inicio" />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  panel: {
    flex: 1,
    marginTop: -PANEL_SOBRE_MAPA,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
  },

  asa: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },

  filaOrigen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },

  iconoOrigen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  textoOrigen: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 12,
  },

  origenNombre: {
    fontSize: 15,
    fontWeight: "700",
  },

  botonIntercambio: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  campoDestino: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },

  campoDestinoTexto: {
    flex: 1,
  },

  input: {
    paddingVertical: 2,
    fontSize: 16,
    fontWeight: "700",
  },

  pie: {
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },

  lista: {
    paddingTop: 10,
    paddingBottom: 16,
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
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  lugarTextos: {
    flex: 1,
  },

  lugarNombre: {
    fontSize: 15,
    fontWeight: "700",
  },

  lugarDetalle: {
    fontSize: 13,
    marginTop: 2,
  },
});
