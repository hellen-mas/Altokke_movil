import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { 
  Pressable, 
  RefreshControl, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View 
} from "react-native";
import {
  LUGARES_BAGUA,
  type ViajeHistorial,
} from "@/features/viajes/constants/pasajero";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { formatearFechaHora, formatearSoles } from "@/features/viajes/utils/viaje";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Filtro = "todos" | "completado" | "cancelado";

const FILTROS: { id: Filtro; titulo: string }[] = [
  { id: "todos", titulo: "Todos" },
  { id: "completado", titulo: "Completados" },
  { id: "cancelado", titulo: "Cancelados" },
];

const MENSAJE_VACIO: Record<Filtro, string> = {
  todos: "Todavía no tienes viajes.",
  completado: "No tienes viajes completados.",
  cancelado: "No tienes viajes cancelados.",
};

export default function PantallaActividad() {
  const { colores, esOscuro } = useAltokkeTheme();
  const insets = useSafeAreaInsets();

  const { historial, setDestino, recargarHistorial } = useViaje();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    void recargarHistorial();
  }, []);

  const alRefrescar = async () => {
    setRefrescando(true);

    try {
      await recargarHistorial();
    } finally {
      setRefrescando(false);
    }
  };

  const viajes =
    filtro === "todos"
      ? historial
      : historial.filter((viaje) => viaje.estado === filtro);

  // Pide otra vez el mismo viaje: si se conoce el destino se pasa directo a
  // confirmar, si no se vuelve a elegir
  const solicitarDeNuevo = (viaje: ViajeHistorial) => {
    const lugar =
      viaje.lugarDestino ??
      LUGARES_BAGUA.find((candidato) => candidato.nombre === viaje.destino);

    if (lugar) {
      setDestino(lugar);
      router.push("/confirmar-viaje");
    } else {
      setDestino(null);
      router.push("/destino");
    }
  };

  const reportarProblema = (viajeId: string) => {
    router.push({
      pathname: "/reportar-viaje",
      params: { viajeId },
    });
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <StatusBar style={esOscuro ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contenido,
          { paddingTop: insets.top + 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alRefrescar}
            tintColor={colores.primario}
            colors={[colores.exitoTexto]}
          />
        }
      >

        {/* Encabezado principal */}
        <View style={styles.encabezado}>
          <View style={styles.encabezadoTextos}>
            <Text style={[styles.titulo, { color: colores.texto }]}>Actividad</Text>
            <Text style={[styles.subtitulo, { color: colores.secundario }]}>Consulta tus viajes recientes y vuelve a solicitar</Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={[styles.filtros, { backgroundColor: colores.campo }]}>
          {FILTROS.map((opcion) => {
            const activo = opcion.id === filtro;

            return (
              <Pressable
                key={opcion.id}
                onPress={() => setFiltro(opcion.id)}
                style={({ pressed }) => [
                  styles.filtro,
                  {
                    backgroundColor: activo
                      ? pressed
                        ? colores.primarioPresionado
                        : colores.primario
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    {
                      color: activo
                        ? colores.textoBoton
                        : colores.secundario,
                    },
                  ]}
                >
                  {opcion.titulo}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Título de resultados */}
        <View style={styles.encabezadoHistorial}>
          <Text
            style={[
              styles.historialTitulo,
              { color: colores.texto },
            ]}
          >
            Historial de viajes
          </Text>

          <Text
            style={[
              styles.contador,
              { color: colores.secundario },
            ]}
          >
            {viajes.length}{" "}
            {viajes.length === 1 ? "viaje" : "viajes"}
          </Text>
        </View>


        <View style={styles.lista}>
          {/* Sin resultados */}
          {viajes.length === 0 && (
            <View 
              style={[
                styles.vacio,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.linea,
                },
              ]}
            >
              <View
                style={[
                  styles.vacioIcono,
                  { backgroundColor: colores.exitoFondo },
                ]}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={32}
                  color={colores.exitoTexto}
                />
              </View>

              <Text
                style={[
                  styles.vacioTitulo,
                  { color: colores.texto },
                ]}
              >
                Sin viajes por aquí
              </Text>

              <Text style={[styles.vacioDescripcion, { color: colores.secundario }]}>
                {MENSAJE_VACIO[filtro]}
              </Text>

              {filtro === "todos" && (
                <Pressable
                  onPress={() => router.push("/mapa")}
                  style={({ pressed }) => [
                    styles.botonVacio,
                    {
                      backgroundColor: pressed
                        ? colores.primarioPresionado
                        : colores.primario,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.textoBotonVacio,
                      { color: colores.textoBoton },
                    ]}
                  >
                    Solicitar un mototaxi
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Tarjeta de viajes */}
          {viajes.map((viaje) => {
            const completado = viaje.estado === "completado";

            return (
              <View
                key={viaje.id}
                style={[
                  styles.tarjeta,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.linea,
                  },
                ]}
              >
                {/* Fecha y estado */}
                <View style={styles.filaSuperior}>
                  <View style={styles.fechaContenedor}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={colores.secundario}
                    />

                    <Text
                      style={[
                        styles.fecha,
                        { color: colores.secundario },
                      ]}
                      numberOfLines={2}
                    >
                      {formatearFechaHora(viaje.fecha)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.estadoCaja,
                      {
                        backgroundColor: completado
                          ? colores.exitoFondo
                          : colores.errorFondo,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        completado
                          ? "checkmark-circle"
                          : "close-circle"
                      }
                      size={14}
                      color={
                        completado
                          ? colores.exitoTexto
                          : colores.error
                      }
                    />

                    <Text
                      style={[
                        styles.estadoTexto,
                        {
                          color: completado
                            ? colores.exitoTexto
                            : colores.error,
                        },
                      ]}
                    >
                      {completado
                        ? "Completado"
                        : "Cancelado"}
                    </Text>
                  </View>
                </View>

                {/* Recorrido */}
                  <View style={styles.recorrido}>
                    <View style={styles.lineaRecorrido}>
                      <View style={[styles.puntoOrigen, { backgroundColor: colores.exitoTexto }]} />
                      <View
                        style={[
                          styles.conector,
                          { backgroundColor: colores.linea },
                        ]}
                      />
                      <View
                        style={[
                          styles.puntoDestino,
                          {
                            borderColor: colores.secundario,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.datosRecorrido}>
                      <View style={styles.lugarBloque}>
                        <Text
                          style={[
                            styles.etiquetaLugar,
                            { color: colores.secundario },
                          ]}
                        >
                          ORIGEN
                        </Text>

                        <Text
                          style={[
                            styles.lugarTexto,
                            { color: colores.texto },
                          ]}
                          numberOfLines={2}
                        >
                          {viaje.origen}
                        </Text>
                      </View>

                      <View style={styles.lugarBloque}>
                        <Text
                          style={[
                            styles.etiquetaLugar,
                            { color: colores.secundario },
                          ]}
                        >
                          DESTINO
                        </Text>

                        <Text
                          style={[
                            styles.lugarTexto,
                            { color: colores.texto },
                          ]}
                          numberOfLines={2}
                        >
                          {viaje.destino}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Tarifa y nueva solicitud */}
                  <View
                    style={[
                      styles.filaAcciones,
                      { borderTopColor: colores.linea },
                    ]}
                  >
                    <View style={styles.tarifaBloque}>
                      <Text
                        style={[
                          styles.tarifaEtiqueta,
                          { color: colores.secundario },
                        ]}
                      >
                        {completado
                          ? "TARIFA REGISTRADA"
                          : "TARIFA ESTIMADA"}
                      </Text>

                      <Text
                        style={[
                          styles.tarifa,
                          { color: colores.texto },
                        ]}
                      >
                        {formatearSoles(viaje.tarifa)}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => solicitarDeNuevo(viaje)}
                      accessibilityRole="button"
                      accessibilityLabel="Solicitar este viaje de nuevo"
                      style={({ pressed }) => [
                        styles.botonRepetir,
                        {
                          backgroundColor: pressed
                            ? colores.primarioPresionado
                            : colores.primario,
                        },
                      ]}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={17}
                        color={colores.textoBoton}
                      />

                      <Text
                        style={[
                          styles.repetirTexto,
                          { color: colores.textoBoton },
                        ]}
                      >
                        Solicitar de nuevo
                      </Text>
                    </Pressable>
                  </View>

                {/* Reportar inconveniente */}
                <Pressable
                  onPress={() => reportarProblema(viaje.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Reportar un problema con este viaje"
                  style={({ pressed }) => [
                    styles.filaReportar,
                    { borderTopColor: colores.linea },
                    pressed && {
                      backgroundColor: colores.campo,
                    },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={colores.exitoTexto}
                  />

                  <Text
                    style={[
                      styles.reportarTexto,
                      { color: colores.exitoTexto },
                    ]}
                  >
                    ¿Tuviste algún problema?
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colores.secundario}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text
          style={[
            styles.piePagina,
            { color: colores.secundario },
          ]}
        >
          Tu historial, siempre a tu alcance.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    pantalla: {
    flex: 1,
  },

  contenido: {
    paddingBottom: 30,
  },

  encabezado: {
    marginTop: 4,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  encabezadoTextos: {
    flex: 1,
    gap: 5,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  subtitulo: {
    fontSize: 13,
    lineHeight: 19,
  },

  iconoEncabezado: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  filtros: {
    marginTop: 23,
    marginHorizontal: 20,
    flexDirection: "row",
    padding: 5,
    borderRadius: 999,
    gap: 3,
  },

  filtro: {
    flex: 1,
    minHeight: 41,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  filtroTexto: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  encabezadoHistorial: {
    marginTop: 28,
    marginBottom: 13,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  historialTitulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },

  contador: {
    fontSize: 12,
    fontWeight: "600",
  },

  lista: {
    marginHorizontal: 16,
    gap: 14,
  },

  tarjeta: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 18,
    overflow: "hidden",
  },

  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  fechaContenedor: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  fecha: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
  },

  estadoCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  estadoTexto: {
    fontSize: 11,
    fontWeight: "700",
  },

  recorrido: {
    flexDirection: "row",
    gap: 13,
    paddingHorizontal: 3,
  },

  lineaRecorrido: {
    width: 14,
    alignItems: "center",
    paddingTop: 7,
  },

  puntoOrigen: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  conector: {
    width: 2,
    height: 59,
    marginVertical: 5,
    borderRadius: 1,
  },

  puntoDestino: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },

  datosRecorrido: {
    flex: 1,
    justifyContent: "space-between",
    gap: 22,
  },

  lugarBloque: {
    gap: 4,
  },

  etiquetaLugar: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
  },

  lugarTexto: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  filaAcciones: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tarifaBloque: {
    flex: 1,
    gap: 4,
  },

  tarifaEtiqueta: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  tarifa: {
    fontSize: 20,
    fontWeight: "800",
  },

  botonRepetir: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  repetirTexto: {
    fontSize: 12,
    fontWeight: "700",
  },

  filaReportar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  reportarTexto: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },

  vacio: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 35,
    gap: 10,
  },

  vacioIcono: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  vacioTitulo: {
    fontSize: 17,
    fontWeight: "700",
  },

  vacioDescripcion: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },

  botonVacio: {
    marginTop: 12,
    borderRadius: 999,
    minHeight: 46,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  textoBotonVacio: {
    fontSize: 14,
    fontWeight: "700",
  },

  piePagina: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 11,
  },
});
