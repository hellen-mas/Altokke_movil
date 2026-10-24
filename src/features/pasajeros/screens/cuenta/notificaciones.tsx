import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { ItemMenu } from "@/features/pasajeros/components/ItemMenu";
import { useNotificaciones } from "@/features/notificaciones/context/NotificacionesContext";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

type Clave =
  | "promociones"
  | "viaje"
  | "recordatorios"
  | "correo"
  | "push"
  | "sms";

interface Opcion {
  clave: Clave;
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo: string;
}

const TIPOS: Opcion[] = [
  {
    clave: "promociones",
    icono: "pricetag-outline",
    titulo: "Promociones y ofertas",
    subtitulo: "Recibe novedades y descuentos exclusivos",
  },
  {
    clave: "viaje",
    icono: "navigate-outline",
    titulo: "Actualizaciones de viaje",
    subtitulo: "Estado de tu mototaxi en tiempo real",
  },
  {
    clave: "recordatorios",
    icono: "alarm-outline",
    titulo: "Recordatorios",
    subtitulo: "Avisos importantes y recomendaciones",
  },
];

const CANALES: Opcion[] = [
  {
    clave: "correo",
    icono: "mail-outline",
    titulo: "Notificaciones por correo",
    subtitulo: "Comprobantes y avisos en tu email",
  },
  {
    clave: "push",
    icono: "notifications-outline",
    titulo: "Notificaciones push",
    subtitulo: "Alertas emergentes en tu celular",
  },
  {
    clave: "sms",
    icono: "chatbubble-outline",
    titulo: "Notificaciones por SMS",
    subtitulo: "Mensajes de texto de seguridad",
  },
];

export default function Notificaciones() {
  const { colores } = useAltokkeTheme();
  const { preferencias, actualizarPreferencia } = useNotificaciones();

  const cambiar = async (clave: Clave, value: boolean) => {
    try {
      await actualizarPreferencia(clave, value);
    } catch (err) {
      console.warn("Aviso al guardar preferencias de notificación:", err);
    }
  };

  const renderItem = (opcion: Opcion) => (
    <ItemMenu
      key={opcion.clave}
      icono={opcion.icono}
      titulo={opcion.titulo}
      subtitulo={opcion.subtitulo}
      sinFlecha
      derecha={
        <Switch
          value={Boolean(preferencias[opcion.clave])}
          onValueChange={(value) => cambiar(opcion.clave, value)}
          trackColor={{
            false: colores.progresoInactivo,
            true: colores.primario,
          }}
          thumbColor={colores.superficie}
        />
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Notificaciones" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {TIPOS.map(renderItem)}

        <View style={styles.separador} />

        {CANALES.map(renderItem)}
      </ScrollView>
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

  separador: {
    height: 16,
  },
});
