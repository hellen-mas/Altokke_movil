import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarPerfil } from "@/components/cuenta/AvatarPerfil";
import { ItemMenu } from "@/components/cuenta/ItemMenu";
import { BarraInferior } from "@/components/pasajero/BarraInferior";
import { COLORES_CUENTA, PASAJERO_DEMO } from "@/constants/cuenta";
import { paletaColores } from "@/paletaColores";

const OPCIONES = [
  {
    icono: "person-outline",
    titulo: "Información personal",
    subtitulo: "Tu perfil y datos de cuenta",
    ruta: "/cuenta/informacion-personal",
  },
  {
    icono: "shield-checkmark-outline",
    titulo: "Seguridad",
    subtitulo: "Protege tu cuenta",
    ruta: "/cuenta/seguridad",
  },
  {
    icono: "card-outline",
    titulo: "Métodos de pago",
    subtitulo: "Efectivo, Yape y Plin",
    ruta: "/cuenta/metodos-pago",
  },
  {
    icono: "location-outline",
    titulo: "Direcciones guardadas",
    subtitulo: "Casa, trabajo y más",
    ruta: "/cuenta/direcciones",
  },
  {
    icono: "notifications-outline",
    titulo: "Notificaciones",
    subtitulo: "Elige qué quieres recibir",
    ruta: "/cuenta/notificaciones",
  },
  {
    icono: "settings-outline",
    titulo: "Configuración",
    subtitulo: "Idioma, apariencia y más",
    ruta: "/cuenta/configuracion",
  },
  {
    icono: "help-circle-outline",
    titulo: "Ayuda",
    subtitulo: "Centro de soporte y preguntas frecuentes",
    ruta: "/ayuda",
  },
] as const;

export default function CuentaPasajero() {
  const insets = useSafeAreaInsets();

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => router.replace("/login"),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Iconos claros porque la cabecera es verde oscuro */}
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.cabecera, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.logo}>Altokke</Text>
          <Text style={styles.lema}>Tu movilidad en buenas manos</Text>

          <View style={styles.perfil}>
            <AvatarPerfil
              nombre={PASAJERO_DEMO.nombre}
              tamano={84}
              enLinea
              conBorde
            />

            <View style={styles.perfilTextos}>
              <Text style={styles.nombre}>{PASAJERO_DEMO.nombre}</Text>

              <View style={styles.filaInfo}>
                <Ionicons name="star" size={15} color={paletaColores.advertencia} />
                <Text style={styles.calificacion}>{PASAJERO_DEMO.calificacion}</Text>
                <Text style={styles.viajes}>({PASAJERO_DEMO.viajes} viajes)</Text>
              </View>

              <View style={styles.filaInfo}>
                <Text style={styles.mensaje}>Tu próxima parada está más cerca</Text>
                <Ionicons name="heart" size={12} color={paletaColores.verde} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.lista}>
          {OPCIONES.map((opcion) => (
            <ItemMenu
              key={opcion.titulo}
              variante="tarjeta"
              icono={opcion.icono}
              titulo={opcion.titulo}
              subtitulo={opcion.subtitulo}
              onPress={() => router.push(opcion.ruta)}
            />
          ))}

          <ItemMenu
            variante="tarjeta"
            peligro
            icono="log-out-outline"
            titulo="Cerrar sesión"
            subtitulo="Salir de tu cuenta"
            onPress={cerrarSesion}
          />
        </View>
      </ScrollView>

      <BarraInferior activa="cuenta" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  scrollContent: {
    paddingBottom: 16,
  },

  cabecera: {
    paddingHorizontal: 20,
    paddingBottom: 44,
    backgroundColor: COLORES_CUENTA.cabecera,
  },

  logo: {
    fontSize: 20,
    fontWeight: "800",
    color: paletaColores.texto,
  },

  lema: {
    marginTop: 2,
    fontSize: 12,
    color: paletaColores.textoSecundario,
  },

  perfil: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },

  perfilTextos: {
    flex: 1,
    gap: 4,
  },

  nombre: {
    fontSize: 22,
    fontWeight: "700",
    color: paletaColores.texto,
  },

  filaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  calificacion: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.texto,
  },

  viajes: {
    fontSize: 13,
    color: paletaColores.textoSecundario,
  },

  mensaje: {
    fontSize: 12,
    color: paletaColores.verde,
  },

  lista: {
    gap: 10,
    marginTop: -24,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: paletaColores.fondoClaro,
  },
});
