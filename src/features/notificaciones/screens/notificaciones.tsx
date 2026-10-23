import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { NOTIFICACIONES_EJEMPLO } from "@/features/viajes/constants/pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface NotificacionItem {
  id: string;
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  mensaje: string;
  hora: string;
  leida: boolean;
}

export default function PantallaNotificaciones() {
  const { colores } = useAltokkeTheme();
  const [lista, setLista] = useState<NotificacionItem[]>(() => [...NOTIFICACIONES_EJEMPLO]);

  const marcarComoLeida = (id: string) => {
    setLista((prev) =>
      prev.map((item) => (item.id === id ? { ...item, leida: true } : item))
    );
  };

  const marcarTodasLeidas = () => {
    setLista((prev) => prev.map((item) => ({ ...item, leida: true })));
    Alert.alert("Notificaciones", "Todas las notificaciones han sido marcadas como leídas.");
  };

  const hayNoLeidas = lista.some((n) => !n.leida);

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Notificaciones" />

      <ScrollView contentContainerStyle={styles.contenido}>
        {hayNoLeidas && (
          <Pressable
            style={[styles.botonMarcarTodas, { borderColor: colores.linea }]}
            onPress={marcarTodasLeidas}
          >
            <Ionicons name="checkmark-done-outline" size={18} color={colores.exitoTexto} />
            <Text style={[styles.textoMarcarTodas, { color: colores.exitoTexto }]}>
              Marcar todas como leídas
            </Text>
          </Pressable>
        )}

        {lista.map((notificacion) => (
          <Pressable
            key={notificacion.id}
            onPress={() => marcarComoLeida(notificacion.id)}
            style={({ pressed }) => [
              styles.tarjeta,
              {
                backgroundColor: colores.superficie,
                borderColor: notificacion.leida ? colores.linea : colores.primario,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={[styles.icono, { backgroundColor: colores.exitoFondo }]}>
              <Ionicons
                name={notificacion.icono}
                size={22}
                color={colores.exitoTexto}
              />
            </View>

            <View style={styles.textos}>
              <Text style={[styles.titulo, { color: colores.texto }]}>
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
              <View style={[styles.puntoNuevo, { backgroundColor: colores.error }]} />
            )}
          </Pressable>
        ))}
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
});
