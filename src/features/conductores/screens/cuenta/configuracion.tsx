import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { OpcionCuenta } from "@/features/conductores/components/OpcionCuenta";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

export default function ConfiguracionConductor() {
  const { estilos: styles } = useTemaConductor(crearEstilos);
  const { modoPreferido } = useAltokkeTheme();
  const temas = { claro: "Claro", oscuro: "Oscuro", automatico: "Automático" };

  return (
    <View style={styles.container}>
      <CabeceraConductor
        titulo="Configuración"
        mostrarAtras
        compacta
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.opciones}>
          <OpcionCuenta
            icono="globe"
            titulo="Idioma"
            descripcion="Español (Perú)"
            onPress={() => router.push("/(conductor)/cuenta/ajustes/idioma")}
          />
          <OpcionCuenta
            icono="notifications"
            titulo="Notificaciones"
            descripcion="Permiso de notificaciones del dispositivo"
            onPress={() => router.push("/(conductor)/cuenta/ajustes/notificaciones")}
          />
          <OpcionCuenta
            icono="moon"
            titulo="Apariencia"
            descripcion={temas[modoPreferido]}
            onPress={() => router.push("/(conductor)/cuenta/ajustes/apariencia")}
          />
          <OpcionCuenta
            icono="map"
            titulo="Preferencias de mapa"
            descripcion="Estilo estándar"
            onPress={() => router.push("/(conductor)/cuenta/ajustes/mapa")}
          />
          <OpcionCuenta
            icono="lock-closed"
            titulo="Privacidad y Seguridad"
            descripcion="Seguridad de la cuenta, contraseña y ayuda"
            onPress={() => router.push("/(conductor)/cuenta/seguridad")}
            ultimo
          />
        </View>

        <View style={styles.opciones}>
          <OpcionCuenta
            icono="log-out"
            titulo="Cerrar sesión"
            descripcion="Salir de tu cuenta"
            onPress={() => router.push("/(conductor)/cuenta/ajustes/cerrar-sesion")}
            ultimo
          />
        </View>

        <View style={styles.opciones}>
          <OpcionCuenta
            icono="trash-outline"
            titulo="Eliminar cuenta"
            descripcion="Solicitar la eliminación de tu cuenta"
            onPress={() => router.push("/(conductor)/cuenta/ajustes/eliminar-cuenta")}
            ultimo
          />
        </View>
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.fondo,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  opciones: {
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: c.borde,
    borderRadius: 18,
    backgroundColor: c.superficie,
    overflow: "hidden",
  },
});
