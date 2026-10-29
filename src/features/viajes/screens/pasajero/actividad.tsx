import { TarjetaViajeHistorial } from "@/features/viajes/components/TarjetaViajeHistorial";
import {
  LUGARES_BAGUA,
  type ViajeHistorial,
} from "@/features/viajes/constants/pasajero";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  }, [recargarHistorial]);

  const alRefrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await recargarHistorial();
    } finally {
      setRefrescando(false);
    }
  }, [recargarHistorial]);

  const viajes = useMemo(() => {
    return filtro === "todos"
      ? historial
      : historial.filter((viaje) => viaje.estado === filtro);
  }, [historial, filtro]);

  const solicitarDeNuevo = useCallback(
    (viaje: ViajeHistorial) => {
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
    },
    [setDestino]
  );

  const reportarProblema = useCallback((viajeId: string) => {
    router.push({
      pathname: "/reportar-viaje",
      params: { viajeId },
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ViajeHistorial }) => (
      <TarjetaViajeHistorial
        viaje={item}
        colores={colores}
        onSolicitar={solicitarDeNuevo}
        onReportar={reportarProblema}
      />
    ),
    [colores, solicitarDeNuevo, reportarProblema]
  );

  const keyExtractor = useCallback((item: ViajeHistorial) => item.id, []);

  const renderHeader = useMemo(
    () => (
      <View>
        {/* Encabezado principal */}
        <View style={styles.encabezado}>
          <View style={styles.encabezadoTextos}>
            <Text style={[styles.titulo, { color: colores.texto }]}>
              Actividad
            </Text>
            <Text style={[styles.subtitulo, { color: colores.secundario }]}>
              Consulta tus viajes recientes y vuelve a solicitar
            </Text>
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
                      color: activo ? colores.textoBoton : colores.secundario,
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
          <Text style={[styles.historialTitulo, { color: colores.texto }]}>
            Historial de viajes
          </Text>

          <Text style={[styles.contador, { color: colores.secundario }]}>
            {viajes.length} {viajes.length === 1 ? "viaje" : "viajes"}
          </Text>
        </View>
      </View>
    ),
    [colores, filtro, viajes.length]
  );

  const renderEmpty = useMemo(
    () => (
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

        <Text style={[styles.vacioTitulo, { color: colores.texto }]}>
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
    ),
    [colores, filtro]
  );

  const renderFooter = useMemo(() => {
    if (viajes.length === 0) return null;
    return (
      <Text style={[styles.piePagina, { color: colores.secundario }]}>
        Tu historial, siempre a tu alcance.
      </Text>
    );
  }, [viajes.length, colores.secundario]);

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <StatusBar style={esOscuro ? "light" : "dark"} />

      <FlashList
        data={viajes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contenido,
          { paddingTop: insets.top + 16 },
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alRefrescar}
            tintColor={colores.primario}
            colors={[colores.exitoTexto]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenido: {
    paddingBottom: 36,
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
  },
  encabezadoHistorial: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 14,
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
  vacio: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 35,
    marginHorizontal: 16,
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
    marginTop: 16,
    marginBottom: 10,
    fontSize: 11,
  },
});
