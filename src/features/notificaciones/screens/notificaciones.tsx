import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useNotificaciones } from "@/features/notificaciones/context/NotificacionesContext";
import type { NotificacionItem } from "@/features/notificaciones/types/notificaciones";
import { useAltokkeTheme, type ColoresTema } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";

const Separador = () => <View style={styles.separador} />;

const TarjetaNotificacion = React.memo(function TarjetaNotificacion({
  notificacion,
  colores,
  onMarcar,
}: {
  notificacion: NotificacionItem;
  colores: ColoresTema;
  onMarcar: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onMarcar(notificacion.id)}
      style={({ pressed }) => [
        styles.tarjeta,
        {
          backgroundColor: colores.superficie,
          borderColor: notificacion.leida ? colores.linea : colores.primario,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View
        style={[
          styles.icono,
          {
            backgroundColor: notificacion.leida
              ? colores.campo
              : colores.exitoFondo,
          },
        ]}
      >
        <Ionicons
          name={notificacion.icono}
          size={22}
          color={notificacion.leida ? colores.secundario : colores.exitoTexto}
        />
      </View>

      <View style={styles.textos}>
        <Text
          style={[
            styles.titulo,
            {
              color: colores.texto,
              fontWeight: notificacion.leida ? "600" : "800",
            },
          ]}
        >
          {notificacion.titulo}
        </Text>
        <Text style={[styles.mensaje, { color: colores.secundario }]}>
          {notificacion.mensaje}
        </Text>
        <Text style={[styles.hora, { color: colores.secundario }]}>
          {notificacion.hora}
        </Text>
      </View>

      {!notificacion.leida && (
        <View
          style={[styles.puntoNuevo, { backgroundColor: colores.error }]}
        />
      )}
    </Pressable>
  );
});

export default function PantallaNotificaciones() {
  const { colores } = useAltokkeTheme();
  const {
    notificaciones,
    marcarComoLeida,
    marcarTodasLeidas,
    hayNoLeidas,
    cargando,
  } = useNotificaciones();

  const handleMarcarTodasLeidas = useCallback(async () => {
    await marcarTodasLeidas();
    Alert.alert(
      "Notificaciones",
      "Todas las notificaciones han sido marcadas como leídas."
    );
  }, [marcarTodasLeidas]);

  const renderItem = useCallback(
    ({ item }: { item: NotificacionItem }) => (
      <TarjetaNotificacion
        notificacion={item}
        colores={colores}
        onMarcar={marcarComoLeida}
      />
    ),
    [colores, marcarComoLeida]
  );

  const keyExtractor = useCallback((item: NotificacionItem) => item.id, []);

  const renderHeader = useMemo(() => {
    if (!hayNoLeidas) return null;
    return (
      <View style={styles.headerContenedor}>
        <Pressable
          style={[styles.botonMarcarTodas, { borderColor: colores.linea }]}
          onPress={handleMarcarTodasLeidas}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={18}
            color={colores.exitoTexto}
          />
          <Text
            style={[styles.textoMarcarTodas, { color: colores.exitoTexto }]}
          >
            Marcar todas como leídas
          </Text>
        </Pressable>
      </View>
    );
  }, [hayNoLeidas, colores, handleMarcarTodasLeidas]);

  const renderEmpty = useMemo(() => {
    if (cargando) {
      return (
        <View style={styles.centroVacio}>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={[styles.textoVacio, { color: colores.secundario }]}>
            Cargando notificaciones...
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.centroVacio}>
        <View
          style={[
            styles.iconoVacio,
            { backgroundColor: colores.superficie, borderColor: colores.linea },
          ]}
        >
          <Ionicons
            name="notifications-off-outline"
            size={36}
            color={colores.secundario}
          />
        </View>
        <Text style={[styles.tituloVacio, { color: colores.texto }]}>
          No tienes notificaciones
        </Text>
        <Text style={[styles.textoVacio, { color: colores.secundario }]}>
          Aquí aparecerán las actualizaciones en tiempo real sobre tus viajes y
          avisos importantes.
        </Text>
      </View>
    );
  }, [cargando, colores]);

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Notificaciones" />

      <View style={styles.listaContenedor}>
        <FlashList
          data={notificaciones}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={Separador}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  listaContenedor: {
    flex: 1,
  },
  contenido: {
    padding: 16,
    paddingBottom: 32,
  },
  separador: {
    height: 12,
  },
  headerContenedor: {
    marginBottom: 12,
  },
  botonMarcarTodas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  textoMarcarTodas: {
    fontSize: 13,
    fontWeight: "700",
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
    flex: 1,
    gap: 4,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "600",
  },
  mensaje: {
    fontSize: 13,
    lineHeight: 18,
  },
  hora: {
    fontSize: 11,
  },
  puntoNuevo: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  centroVacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  iconoVacio: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  tituloVacio: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  textoVacio: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
