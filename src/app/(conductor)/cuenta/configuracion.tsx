import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { OpcionCuenta } from "@/components/conductor/OpcionCuenta";
import { paletaColores } from "@/paletaColores";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

const mostrarProximamente = () => {
  Alert.alert("Próximamente", "Esta opción todavía no está disponible.");
};

export default function ConfiguracionConductor() {
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