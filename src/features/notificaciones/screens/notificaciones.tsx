import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useNotificaciones } from "@/features/notificaciones/context/NotificacionesContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PantallaNotificaciones() {
  const { colores } = useAltokkeTheme();
  const {
    notificaciones,
    marcarComoLeida,
    marcarTodasLeidas,
    hayNoLeidas,
    cargando,
  } = useNotificaciones();

  const handleMarcarTodasLeidas = async () => {
    await marcarTodasLeidas();
    Alert.alert(
      "Notificaciones",
      "Todas las notificaciones han sido marcadas como leídas."
    );
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Notificaciones" />

      <ScrollView contentContainerStyle={styles.contenido}>
        {cargando ? (
          <View style={styles.centroVacio}>
            <ActivityIndicator size="large" color={colores.primario} />
            <Text style={[styles.textoVacio, { color: colores.secundario }]}>
              Cargando notificaciones...
            </Text>
          </View>
        ) : notificaciones.length === 0 ? (
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
              Aquí aparecerán las actualizaciones en tiempo real sobre tus viajes y avisos importantes.
            </Text>
          </View>
        ) : (
          <>
            {hayNoLeidas && (
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
            )}

            {notificaciones.map((notificacion) => (
              <Pressable
                key={notificacion.id}
                onPress={() => marcarComoLeida(notificacion.id)}
                style={({ pressed }) => [
                  styles.tarjeta,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: notificacion.leida
                      ? colores.linea
                      : colores.primario,
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
                    color={
                      notificacion.leida
                        ? colores.secundario
                        : colores.exitoTexto
                    }
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
                    style={[
                      styles.puntoNuevo,
                      { backgroundColor: colores.error },
                    ]}
                  />
                )}
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  contenido: {
    padding: 16,
    gap: 12,
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
