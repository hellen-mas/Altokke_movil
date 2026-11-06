import { ScrollView, StyleSheet, View } from "react-native";
import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { ItemMenu } from "@/components/cuenta/ItemMenu";
import { paletaColores } from "@/paletaColores";

export default function Configuracion() {
  return (
    <View style={styles.container}>
      <EncabezadoPantalla titulo="Configuración" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <ItemMenu icono="globe-outline" titulo="Idioma" subtitulo="Español" />
        <ItemMenu icono="moon-outline" titulo="Tema" subtitulo="Automático" />
        <ItemMenu
          icono="speedometer-outline"
          titulo="Unidades de distancia"
          subtitulo="Kilómetros (km)"
        />
        <ItemMenu icono="map-outline" titulo="Mapa" subtitulo="Estilo estándar" />
        <ItemMenu
          icono="lock-closed-outline"
          titulo="Privacidad"
          subtitulo="Controla tu información"
        />
        <ItemMenu
          icono="cellular-outline"
          titulo="Uso de datos"
          subtitulo="Optimiza el consumo"
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
});
