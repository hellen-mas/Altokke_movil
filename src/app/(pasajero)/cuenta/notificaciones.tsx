import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { ItemMenu } from "@/components/cuenta/ItemMenu";
import { paletaColores } from "@/paletaColores";

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
    subtitulo: "Recibe novedades y descuentos",
  },
  {
    clave: "viaje",
    icono: "navigate-outline",
    titulo: "Actualizaciones de viaje",
    subtitulo: "Estado del viaje en tiempo real",
  },
  {
    clave: "recordatorios",
    icono: "alarm-outline",
    titulo: "Recordatorios",
    subtitulo: "Avisos y recomendaciones",
  },
];

const CANALES: Opcion[] = [
  {
    clave: "correo",
    icono: "mail-outline",
    titulo: "Notificaciones por correo",
    subtitulo: "Recibe comunicaciones en tu email",
  },
  {
    clave: "push",
    icono: "notifications-outline",
    titulo: "Notificaciones push",
    subtitulo: "En tu dispositivo móvil",
  },
  {
    clave: "sms",
    icono: "chatbubble-outline",
    titulo: "Notificaciones por SMS",
    subtitulo: "Mensajes de texto importantes",
  },
];

export default function Notificaciones() {
  const [activas, setActivas] = useState<Record<Clave, boolean>>({
    promociones: true,
    viaje: true,
    recordatorios: true,
    correo: true,
    push: true,
    sms: false,
  });

  const cambiar = (clave: Clave, valor: boolean) => {
    setActivas((anterior) => ({ ...anterior, [clave]: valor }));
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
          value={activas[opcion.clave]}
          onValueChange={(valor) => cambiar(opcion.clave, valor)}
          trackColor={{
            false: paletaColores.bordeClaro,
            true: paletaColores.boton,
          }}
          thumbColor="#FFFFFF"
        />
      }
    />
  );

  return (
    <View style={styles.container}>
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
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  separador: {
    height: 16,
  },
});
