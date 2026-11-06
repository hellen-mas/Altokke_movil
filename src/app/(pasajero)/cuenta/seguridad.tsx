import { ScrollView, StyleSheet, Text, View } from "react-native";
import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { ItemMenu } from "@/components/cuenta/ItemMenu";
import { paletaColores } from "@/paletaColores";

export default function Seguridad() {
  return (
    <View style={styles.container}>
      <EncabezadoPantalla titulo="Seguridad" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <ItemMenu
          icono="lock-closed-outline"
          titulo="Contraseña"
          subtitulo="Cambia tu contraseña"
        />

        <ItemMenu
          icono="shield-checkmark-outline"
          titulo="Verificación en dos pasos"
          subtitulo="Protege tu cuenta"
          derecha={<Text style={styles.activada}>Activada</Text>}
        />

        <ItemMenu
          icono="phone-portrait-outline"
          titulo="Dispositivos vinculados"
          subtitulo="Administra tus sesiones"
        />

        <ItemMenu
          icono="time-outline"
          titulo="Actividad de la cuenta"
          subtitulo="Revisa accesos recientes"
        />
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

  activada: {
    fontSize: 12,
    fontWeight: "600",
    color: paletaColores.boton,
  },
});
