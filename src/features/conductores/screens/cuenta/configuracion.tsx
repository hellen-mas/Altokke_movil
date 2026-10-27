import { AvisoInformativo } from "@/shared/components/ui";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { OpcionCuenta } from "@/features/conductores/components/OpcionCuenta";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { paletaColores } from "@/shared/theme/paletaColores";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { authService } from "@/features/autenticacion/services/authService";
import { useState } from "react";

const mostrarProximamente = () => {
  Alert.alert("Próximamente", "Esta opción todavía no está disponible.");
};

export default function ConfiguracionConductor() {
  const { logout } = useAuth();

  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);

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
        subtitulo="Personaliza tu experiencia en Altokke"
        mostrarAtras
        compacta
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AvisoInformativo
          titulo="En construcción"
          texto="Estas preferencias todavía no se guardan. Se activarán cuando conectemos el backend."
          style={styles.aviso}
        />

        <View style={styles.opciones}>
          <OpcionCuenta
            icono="globe"
            titulo="Idioma"
            descripcion="Español"
            onPress={mostrarProximamente}
          />
          <OpcionCuenta
            icono="notifications"
            titulo="Notificaciones"
            descripcion="Push, sonidos y alertas de viaje"
            onPress={mostrarProximamente}
          />
          <OpcionCuenta
            icono="moon"
            titulo="Apariencia"
            descripcion="Modo claro u oscuro"
            onPress={mostrarProximamente}
          />
          <OpcionCuenta
            icono="map"
            titulo="Preferencias de mapa"
            descripcion="Estilo y navegación"
            onPress={mostrarProximamente}
          />
          <OpcionCuenta
            icono="lock-closed"
            titulo="Privacidad"
            descripcion="Controla tu información"
            onPress={mostrarProximamente}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
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
    borderColor: paletaColores.bordeClaro,
    borderRadius: 18,
    backgroundColor: paletaColores.superficieClara,
    overflow: "hidden",
  },
});
