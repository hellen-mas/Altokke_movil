import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { authService } from "@/features/autenticacion/services/authService";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { OpcionCuenta } from "@/features/conductores/components/OpcionCuenta";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export default function ConfiguracionConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const { modoPreferido, setModoPreferido } = useAltokkeTheme();
  const { logout } = useAuth();

  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);
  const [mapaSatelite, setMapaSatelite] = useState(false);

  const cambiarIdioma = () => {
    Alert.alert("Idioma de Altokke", "El idioma de la aplicación está configurado en Español (Perú).");
  };

  const toggleNotificaciones = () => {
    const estado = !notificaciones;
    setNotificaciones(estado);
    Alert.alert("Notificaciones", estado ? "Alertas y sonidos activados." : "Alertas y sonidos pausados.");
  };

  const cambiarApariencia = () => {
    Alert.alert(
      "Apariencia",
      `Modo actual: ${modoPreferido}. Elige una opción:`,
      [
        { text: "Claro", onPress: () => setModoPreferido("claro") },
        { text: "Oscuro", onPress: () => setModoPreferido("oscuro") },
        { text: "Automático (Sistema)", onPress: () => setModoPreferido("automatico") },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const cambiarPreferenciasMapa = () => {
    const nuevo = !mapaSatelite;
    setMapaSatelite(nuevo);
    Alert.alert("Preferencias de mapa", nuevo ? "Modo satelital activado." : "Modo estándar vectorial activado.");
  };

  const abrirSeguridad = () => {
    router.push("/(conductor)/cuenta/seguridad");
  };

  const confirmarEliminarCuenta = () => {
    if (eliminandoCuenta) return;

    Alert.alert(
      "Eliminar cuenta",
      "¿Deseas eliminar tu cuenta de Altokke? Perderás el acceso y no podrás seguir utilizando esta cuenta. Algunos registros históricos podrán conservarse por obligaciones legales y operativas.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar cuenta",
          style: "destructive",
          onPress: async () => {
            try {
              setEliminandoCuenta(true);

              await authService.eliminarMiCuenta();

              router.replace("/(auth)/bienvenida");
            } catch (error: unknown) {
              const mensaje = error instanceof Error ? error.message : "Inténtalo nuevamente.";
              Alert.alert(
                "No se pudo eliminar la cuenta",
                mensaje
              );
            } finally {
              setEliminandoCuenta(false);
            }
          },
        },
      ]
    );
  };

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
          }
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

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
            onPress={cambiarIdioma}
          />
          <OpcionCuenta
            icono="notifications"
            titulo="Notificaciones"
            descripcion={notificaciones ? "Alertas activadas" : "Alertas pausadas"}
            onPress={toggleNotificaciones}
          />
          <OpcionCuenta
            icono="moon"
            titulo="Apariencia"
            descripcion={`Modo: ${modoPreferido}`}
            onPress={cambiarApariencia}
          />
          <OpcionCuenta
            icono="map"
            titulo="Preferencias de mapa"
            descripcion={mapaSatelite ? "Satelital" : "Vectorial estándar"}
            onPress={cambiarPreferenciasMapa}
          />
          <OpcionCuenta
            icono="lock-closed"
            titulo="Privacidad y Seguridad"
            descripcion="Contraseñas y sesiones activas"
            onPress={abrirSeguridad}
            ultimo
          />
        </View>

        <View style={styles.opciones}>
          <OpcionCuenta
            icono="log-out"
            titulo="Cerrar sesión"
            descripcion="Salir de tu cuenta"
            onPress={cerrarSesion}
            ultimo
          />
        </View>

        <View style={styles.opciones}>
          <OpcionCuenta
            icono="trash-outline"
            titulo="Eliminar cuenta"
            descripcion={
              eliminandoCuenta
                ? "Procesando solicitud..."
                : "Solicitar la eliminación de tu cuenta"
            }
            onPress={confirmarEliminarCuenta}
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

  aviso: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 0,
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
