import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useNotificaciones } from "@/features/notificaciones/context/NotificacionesContext";
import type { NotificacionItem } from "@/features/notificaciones/types/notificaciones";
import { useAltokkeTheme, type ColoresTema } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";

type Filtro = "todas" | "noLeidas";

function fechaValida(fechaIso: string): number {
  const fecha = new Date(fechaIso).getTime();
  return Number.isFinite(fecha) ? fecha : 0;
}

function formatearFecha(fechaIso: string, horaOriginal: string): string {
  const fechaMs = fechaValida(fechaIso);
  if (!fechaMs) return horaOriginal;

  const fecha = new Date(fechaMs);
  const ahora = new Date();

  const esHoy = fecha.toDateString() === ahora.toDateString();

  if (esHoy) {
    const minutos = Math.max(
      0,
      Math.floor((ahora.getTime() - fechaMs) / 60000)
    );

    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `Hace ${minutos} min`;

    return fecha.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);

  if (fecha.toDateString() === ayer.toDateString()) {
    return "Ayer";
  }

  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}

function NotificacionFila({
  notificacion,
  colores,
  onAbrir,
  onEliminar,
}: {
  notificacion: NotificacionItem;
  colores: ColoresTema;
  onAbrir: (id: string) => void;
  onEliminar: (id: string) => void;
}) {
  const nueva = !notificacion.leida;

  return (
    <Pressable
      onPress={() => onAbrir(notificacion.id)}
      onLongPress={() => onEliminar(notificacion.id)}
      accessibilityRole="button"
      accessibilityLabel={`${notificacion.titulo}. ${notificacion.mensaje}`}
      accessibilityHint="Toca para marcar como leída. Mantén presionado para eliminar."
      style={({ pressed }) => [
        styles.fila,
        {
          backgroundColor: nueva
            ? colores.exitoFondo
            : colores.fondo,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View
        style={[
          styles.icono,
          {
            backgroundColor: nueva
              ? colores.superficie
              : colores.campo,
          },
        ]}
      >
        <Ionicons
          name={notificacion.icono}
          size={21}
          color={
            nueva ? colores.exitoTexto : colores.secundario
          }
        />
      </View>

      <View style={styles.contenidoFila}>
        <View style={styles.filaTitulo}>
          <Text
            style={[
              styles.tituloNotificacion,
              {
                color: colores.texto,
                fontWeight: nueva ? "700" : "600",
              },
            ]}
          >
            {notificacion.titulo}
          </Text>

          {nueva && (
            <View
              style={[
                styles.puntoNuevo,
                { backgroundColor: colores.exitoTexto },
              ]}
            />
          )}
        </View>

        <Text
          style={[
            styles.mensaje,
            { color: colores.secundario },
          ]}
        >
          {notificacion.mensaje}
        </Text>

        <Text
          style={[
            styles.fecha,
            { color: colores.secundario },
          ]}
        >
          {formatearFecha(
            notificacion.fechaIso,
            notificacion.hora
          )}
        </Text>
      </View>
    </Pressable>
  );
}

export default function PantallaNotificaciones() {
  const { colores } = useAltokkeTheme();
  const {
    notificaciones,
    marcarComoLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    cargando,
  } = useNotificaciones();

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [procesando, setProcesando] = useState(false);

  const cantidadNoLeidas = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones]
  );

  const listaFiltrada = useMemo(() => {
    const lista =
      filtro === "noLeidas"
        ? notificaciones.filter((n) => !n.leida)
        : [...notificaciones];

    return lista.sort(
      (a, b) =>
        fechaValida(b.fechaIso) - fechaValida(a.fechaIso)
    );
  }, [notificaciones, filtro]);

  const abrirNotificacion = (id: string) => {
    void marcarComoLeida(id);
  };

  const confirmarEliminar = (id: string) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Quieres quitar esta notificación de tu bandeja?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void eliminarNotificacion(id),
        },
      ]
    );
  };

  const marcarTodas = async () => {
    if (cantidadNoLeidas === 0 || procesando) return;

    setProcesando(true);

    try {
      await marcarTodasLeidas();
    } catch (error) {
      console.warn("Error al marcar notificaciones:", error);
      Alert.alert(
        "No se pudo completar",
        "Inténtalo nuevamente."
      );
    } finally {
      setProcesando(false);
    }
  };

  const listaVacia = (
    <View style={styles.estadoVacio}>
      <View
        style={[
          styles.iconoVacio,
          { backgroundColor: colores.campo },
        ]}
      >
        <Ionicons
          name={
            filtro === "noLeidas"
              ? "checkmark-done-outline"
              : "notifications-outline"
          }
          size={32}
          color={colores.secundario}
        />
      </View>

      <Text
        style={[
          styles.tituloVacio,
          { color: colores.texto },
        ]}
      >
        {filtro === "noLeidas"
          ? "Todo al día"
          : "Aún no tienes notificaciones"}
      </Text>

      <Text
        style={[
          styles.descripcionVacio,
          { color: colores.secundario },
        ]}
      >
        {filtro === "noLeidas"
          ? "No tienes notificaciones pendientes por leer."
          : "Aquí recibirás las novedades y actualizaciones de tus viajes."}
      </Text>
    </View>
  );

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Notificaciones" />

      <View style={styles.barraSuperior}>
        <View style={styles.filtros}>
          <Pressable
            onPress={() => setFiltro("todas")}
            accessibilityRole="button"
            accessibilityState={{
              selected: filtro === "todas",
            }}
            style={[
              styles.filtro,
              {
                backgroundColor:
                  filtro === "todas"
                    ? colores.exitoFondo
                    : colores.campo,
              },
            ]}
          >
            <Text
              style={[
                styles.filtroTexto,
                {
                  color:
                    filtro === "todas"
                      ? colores.exitoTexto
                      : colores.secundario,
                },
              ]}
            >
              Todas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFiltro("noLeidas")}
            accessibilityRole="button"
            accessibilityState={{
              selected: filtro === "noLeidas",
            }}
            style={[
              styles.filtro,
              {
                backgroundColor:
                  filtro === "noLeidas"
                    ? colores.exitoFondo
                    : colores.campo,
              },
            ]}
          >
            <Text
              style={[
                styles.filtroTexto,
                {
                  color:
                    filtro === "noLeidas"
                      ? colores.exitoTexto
                      : colores.secundario,
                },
              ]}
            >
              No leídas
              {cantidadNoLeidas > 0
                ? ` (${cantidadNoLeidas})`
                : ""}
            </Text>
          </Pressable>
        </View>

        {cantidadNoLeidas > 0 && (
          <Pressable
            onPress={() => void marcarTodas()}
            disabled={procesando}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como leídas"
          >
            <Text
              style={[
                styles.marcarTodas,
                { color: colores.exitoTexto },
              ]}
            >
              {procesando ? "Marcando..." : "Marcar leídas"}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.listaContenedor}>
        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator
              size="small"
              color={colores.exitoTexto}
            />
            <Text style={{ color: colores.secundario }}>
              Cargando notificaciones...
            </Text>
          </View>
        ) : (
          <FlashList
            data={listaFiltrada}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificacionFila
                notificacion={item}
                colores={colores}
                onAbrir={abrirNotificacion}
                onEliminar={confirmarEliminar}
              />
            )}
            ListEmptyComponent={listaVacia}
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.separador,
                  { backgroundColor: colores.linea },
                ]}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contenidoLista}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  barraSuperior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },

  filtros: {
    flexDirection: "row",
    gap: 7,
  },

  filtro: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },

  filtroTexto: {
    fontSize: 12,
    fontWeight: "600",
  },

  marcarTodas: {
    fontSize: 12,
    fontWeight: "700",
  },

  listaContenedor: {
    flex: 1,
  },

  contenidoLista: {
    paddingBottom: 28,
  },

  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 17,
    minHeight: 98,
  },

  icono: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  contenidoFila: {
    flex: 1,
    gap: 5,
  },

  filaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  tituloNotificacion: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },

  puntoNuevo: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  mensaje: {
    fontSize: 13,
    lineHeight: 19,
  },

  fecha: {
    marginTop: 3,
    fontSize: 11,
  },

  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
    marginRight: 18,
  },

  estadoVacio: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 110,
    gap: 10,
  },

  iconoVacio: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  tituloVacio: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  descripcionVacio: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  cargando: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 110,
  },
});
