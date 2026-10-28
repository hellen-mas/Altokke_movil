import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { CabeceraPasajero } from "@/features/pasajeros/components/CabeceraPasajero";
import {
  COLOR_CABECERA,
  LUGARES_BAGUA,
  ViajeHistorial,
} from "@/features/viajes/constants/pasajero";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { formatearFechaHora, formatearSoles } from "@/features/viajes/utils/viaje";

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
  const { historial, setDestino, recargarHistorial } = useViaje();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    recargarHistorial();
  }, []);

  const alRefrescar = async () => {
    setRefrescando(true);
    await recargarHistorial();
    setRefrescando(false);
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

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alRefrescar}
            tintColor={colores.primario}
          />
        }
      >
        <CabeceraPasajero subtitulo="Tu movilidad en buenas manos" />

        <View style={styles.encabezado}>
          <Text style={[styles.titulo, { color: colores.texto }]}>Actividad</Text>
          <Text style={[styles.subtitulo, { color: colores.secundario }]}>Tus viajes recientes</Text>
        </View>

        {/* Filtros */}
        <View style={[styles.filtros, { backgroundColor: colores.campo }]}>
          {FILTROS.map((opcion) => {
            const activo = opcion.id === filtro;

            return (
              <Pressable
                key={opcion.id}
                onPress={() => setFiltro(opcion.id)}
                style={[
                  styles.filtro,
                  activo && {
                    backgroundColor: esOscuro ? colores.superficie : COLOR_CABECERA,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    {
                      color: activo
                        ? esOscuro
                          ? colores.texto
                          : "#FFFFFF"
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

        {/* Viajes */}
        <View style={styles.lista}>
          {viajes.length === 0 && (
            <View style={styles.vacio}>
              <Ionicons
                name="time-outline"
                size={40}
                color={colores.progresoInactivo}
              />
              <Text style={[styles.vacioTexto, { color: colores.secundario }]}>
                {MENSAJE_VACIO[filtro]}
              </Text>
            </View>
          )}

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
                <View style={styles.filaSuperior}>
                  <Text style={[styles.fecha, { color: colores.secundario }]}>
                    {formatearFechaHora(viaje.fecha)}
                  </Text>
                  <Text
                    style={[
                      styles.estado,
                      completado
                        ? {
                            color: colores.exitoTexto,
                            backgroundColor: colores.exitoFondo,
                          }
                        : {
                            color: colores.error,
                            backgroundColor: colores.errorFondo,
                          },
                    ]}
                  >
                    {completado ? "Completado" : "Cancelado"}
                  </Text>
                </View>

                <View style={styles.cuerpo}>
                  <View style={styles.recorrido}>
                    <View style={styles.filaLugar}>
                      <View style={[styles.puntoOrigen, { backgroundColor: colores.exitoTexto }]} />
                      <Text style={[styles.lugar, { color: colores.texto }]} numberOfLines={1}>
                        {viaje.origen}
                      </Text>
                    </View>
                    <View style={styles.filaLugar}>
                      <View style={[styles.puntoDestino, { borderColor: colores.secundario }]} />
                      <Text style={[styles.lugar, { color: colores.texto }]} numberOfLines={1}>
                        {viaje.destino}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.derecha}>
                    <Text
                      style={[
                        styles.tarifa,
                        { color: colores.texto },
                        !completado && { color: colores.secundario, textDecorationLine: "line-through" },
                      ]}
                    >
                      {formatearSoles(viaje.tarifa)}
                    </Text>

                    <Pressable
                      onPress={() => solicitarDeNuevo(viaje)}
                      style={({ pressed }) => [
                        styles.repetir,
                        { backgroundColor: colores.exitoFondo },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons
                        name="refresh"
                        size={14}
                        color={colores.exitoTexto}
                      />
                      <Text style={[styles.repetirTexto, { color: colores.exitoTexto }]}>
                        Solicitar de nuevo
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  contenido: {
    paddingBottom: 16,
  },

  encabezado: {
    marginTop: 16,
    marginHorizontal: 16,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "800",
  },

  subtitulo: {
    fontSize: 14,
  },

  filtros: {
    flexDirection: "row",
    marginTop: 14,
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 14,
  },

  filtro: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },

  filtroTexto: {
    fontSize: 13,
    fontWeight: "700",
  },

  lista: {
    gap: 10,
    marginTop: 14,
    marginHorizontal: 16,
  },

  vacio: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 48,
  },

  vacioTexto: {
    fontSize: 14,
  },

  tarjeta: {
    padding: 12,
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  fecha: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
  },

  estado: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  cuerpo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  recorrido: {
    flex: 1,
    gap: 12,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  puntoOrigen: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  puntoDestino: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },

  lugar: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },

  derecha: {
    alignItems: "flex-end",
    gap: 8,
  },

  tarifa: {
    fontSize: 17,
    fontWeight: "800",
  },

  repetir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
  },

  repetirTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
});
