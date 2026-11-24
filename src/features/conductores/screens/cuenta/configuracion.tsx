import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { OpcionCuenta } from "@/features/conductores/components/OpcionCuenta";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { router } from "expo-router";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import { authService } from "@/features/autenticacion/services/authService";
import { useState } from "react";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

export default function ConfiguracionConductor() {
  const { estilos: styles } = useTemaConductor(crearEstilos);
  const { logout } = useAuth();

  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);

  const verIdioma = () => {
    Alert.alert("Idioma", "El idioma actual de la aplicación es Español (Perú).");
  };

  const verNotificaciones = () => {
    Alert.alert("Notificaciones", "Las notificaciones sonoras y alertas de viaje en tiempo real están activas.");
  };

  const verApariencia = () => {
    Alert.alert("Apariencia", "El tema visual se ajusta automáticamente según la configuración del sistema de tu dispositivo.");
  };

  const verMapa = () => {
    Alert.alert("Mapa", "El mapa está configurado con cartografía optimizada para la zona urbana de Bagua.");
  };

  const verPrivacidad = () => {
    const url = process.env.EXPO_PUBLIC_PRIVACY_URL || "https://altokke.pe/privacidad";
    Linking.openURL(url).catch(() => {
      Alert.alert("Privacidad", "Tus datos personales y de ubicación están protegidos y cifrados en tránsito.");
    });
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
            } catch (error: any) {
              Alert.alert(
                "No se pudo eliminar la cuenta",
                error?.message || "Inténtalo nuevamente."
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
            onPress={verIdioma}
          />
          <OpcionCuenta
            icono="notifications"
            titulo="Notificaciones"
            descripcion="Push, sonidos y alertas de viaje"
            onPress={verNotificaciones}
          />
          <OpcionCuenta
            icono="moon"
            titulo="Apariencia"
            descripcion="Adaptable al sistema"
            onPress={verApariencia}
          />
          <OpcionCuenta
            icono="map"
            titulo="Preferencias de mapa"
            descripcion="Cartografía urbana de Bagua"
            onPress={verMapa}
          />
          <OpcionCuenta
            icono="lock-closed"
            titulo="Privacidad"
            descripcion="Protección de datos conforme a ley"
            onPress={verPrivacidad}
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
