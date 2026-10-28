import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarPerfil } from "@/features/pasajeros/components/AvatarPerfil";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { TituloAltokke } from "@/shared/components/ui/TituloAltokke";

type NombreIcono = keyof typeof Ionicons.glyphMap;

type OpcionMenu = {
  titulo: string;
  icono: NombreIcono;
  ruta:
    | "/cuenta/informacion-personal"
    | "/cuenta/seguridad"
    | "/cuenta/metodos-pago"
    | "/cuenta/direcciones"
    | "/cuenta/notificaciones"
    | "/cuenta/configuracion"
};

const OPCIONES_CUENTA: OpcionMenu[] = [
  {
    titulo: "Información personal",
    icono: "person-outline",
    ruta: "/cuenta/informacion-personal",
  },
  {
    titulo: "Seguridad",
    icono: "shield-checkmark-outline",
    ruta: "/cuenta/seguridad",
  },
  {
    titulo: "Métodos de pago",
    icono: "card-outline",
    ruta: "/cuenta/metodos-pago",
  },
  {
    titulo: "Direcciones guardadas",
    icono: "location-outline",
    ruta: "/cuenta/direcciones",
  },
];

const OPCIONES_PREFERENCIAS: OpcionMenu[] = [
  {
    titulo: "Notificaciones",
    icono: "notifications-outline",
    ruta: "/cuenta/notificaciones",
  },
  {
    titulo: "Configuración",
    icono: "settings-outline",
    ruta: "/cuenta/configuracion",
  },
];

function GrupoMenu({
  titulo,
  opciones,
}: {
  titulo: string;
  opciones: OpcionMenu[];
}) {
  const { colores } = useAltokkeTheme();

  return (
    <View style={styles.grupo}>
      <Text
        style={[
          styles.tituloGrupo,
          { color: colores.secundario },
        ]}
      >
        {titulo}
      </Text>

      <View
        style={[
          styles.cajaOpciones,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.linea,
          },
        ]}
      >
        {opciones.map((opcion, index) => (
          <View key={opcion.ruta}>
            <Pressable
              onPress={() => router.push(opcion.ruta)}
              accessibilityRole="button"
              accessibilityLabel={opcion.titulo}
              style={({ pressed }) => [
                styles.opcion,
                pressed && {
                  backgroundColor: colores.campo,
                },
              ]}
            >
              <Ionicons
                name={opcion.icono}
                size={21}
                color={colores.exitoTexto}
              />

              <Text
                style={[
                  styles.textoOpcion,
                  { color: colores.texto },
                ]}
              >
                {opcion.titulo}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colores.secundario}
              />
            </Pressable>

            {index !== opciones.length - 1 && (
              <View
                style={[
                  styles.separador,
                  { backgroundColor: colores.linea },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CuentaPasajero() {
  const insets = useSafeAreaInsets();
  const { colores, esOscuro } = useAltokkeTheme();
  const { logout } = useAuth();
  const { perfil } = usePerfilPasajero();

  const nombre =
    perfil?.nombreCompleto ||
    perfil?.primerNombre ||
    "Pasajero";

  const foto = perfil?.fotoUrl || null;

  const calificacion = perfil
    ? perfil.calificacion.toFixed(1)
    : "5.0";

  const viajes = perfil?.viajesCount ?? 0;

  const cerrarSesion = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres salir de tu cuenta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error(
                "Error al cerrar sesión:",
                error
              );

              Alert.alert(
                "Error",
                "No se pudo cerrar sesión. Inténtalo nuevamente."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <StatusBar style={esOscuro ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contenido,
          { paddingTop: insets.top + 20 },
        ]}
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <TituloAltokke
            texto="Mi cuenta"
            style={styles.titulo}
          />

            <Pressable
              onPress={() =>
                router.push("/cuenta/configuracion")
              }
              accessibilityRole="button"
              accessibilityLabel="Abrir configuración"
              style={[
                styles.botonConfig,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={21}
                color={colores.exitoTexto}
              />
            </Pressable>
        </View>

        {/* Perfil del pasajero */}
        <View
          style={[
            styles.tarjetaPerfil,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <AvatarPerfil
            nombre={nombre}
            tamano={84}
            uri={foto}
          />

          <Text
            style={[
              styles.nombre,
              { color: colores.texto },
            ]}
            numberOfLines={2}
          >
            {nombre}
          </Text>

          <Text
            style={[
              styles.rol,
              { color: colores.secundario },
            ]}
          >
            Pasajero Altokke
          </Text>

          <View style={styles.estadisticas}>
            <Ionicons
              name="star"
              size={15}
              color="#D3A33B"
            />

            <Text
              style={[
                styles.textoEstadisticas,
                { color: colores.secundario },
              ]}
            >
              {calificacion} · {viajes} viajes
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push("/cuenta/informacion-personal")
            }
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            style={({ pressed }) => [
              styles.botonEditar,
              {
                backgroundColor: pressed
                  ? colores.primarioPresionado
                  : colores.primario,
              },
            ]}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={colores.textoBoton}
            />

            <Text
              style={[
                styles.textoEditar,
                {
                  color: colores.textoBoton,
                },
              ]}
            >
              Editar perfil
            </Text>
          </Pressable>
        </View>

        {/* Opciones */}
        <GrupoMenu
          titulo="CUENTA Y SEGURIDAD"
          opciones={OPCIONES_CUENTA}
        />

        <GrupoMenu
          titulo="PREFERENCIAS"
          opciones={OPCIONES_PREFERENCIAS}
        />

        {/* Cerrar sesión */}
        <Pressable
          onPress={cerrarSesion}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={({ pressed }) => [
            styles.cerrarSesion,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons
            name="log-out-outline"
            size={19}
            color={colores.error}
          />

          <Text
            style={[
              styles.textoCerrarSesion,
              { color: colores.error },
            ]}
          >
            Cerrar sesión
          </Text>
        </Pressable>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  botonConfig: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  tarjetaPerfil: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 26,
  },

  nombre: {
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },

  rol: {
    fontSize: 13,
    marginTop: 4,
  },

  estadisticas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },

  textoEstadisticas: {
    fontSize: 13,
  },

  botonEditar: {
    marginTop: 20,
    minHeight: 42,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
  },

  textoEditar: {
    fontSize: 13,
    fontWeight: "700",
  },

  grupo: {
    marginBottom: 24,
    gap: 10,
  },

  tituloGrupo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },

  cajaOpciones: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },

  opcion: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
  },

  textoOpcion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 51,
    marginRight: 16,
  },

  cerrarSesion: {
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  textoCerrarSesion: {
    fontSize: 14,
    fontWeight: "600",
  },
});
