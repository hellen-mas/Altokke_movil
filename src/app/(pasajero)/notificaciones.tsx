import { EncabezadoPantalla } from "@/components/cuenta/EncabezadoPantalla";
import { NOTIFICACIONES_EJEMPLO } from "@/constants/pasajero";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function PantallaNotificaciones() {
  return (
    <View style={styles.pantalla}>
      <EncabezadoPantalla titulo="Notificaciones" />

      <ScrollView contentContainerStyle={styles.contenido}>
        {NOTIFICACIONES_EJEMPLO.map((notificacion) => (
          <View
            key={notificacion.id}
            style={[styles.tarjeta, !notificacion.leida && styles.tarjetaNueva]}
          >
            <View style={styles.icono}>
              <Ionicons
                name={notificacion.icono}
                size={22}
                color={paletaColores.boton}
              />
            </View>

            <View style={styles.textos}>
              <Text style={styles.titulo}>{notificacion.titulo}</Text>
              <Text style={styles.mensaje}>{notificacion.mensaje}</Text>
              <Text style={styles.hora}>{notificacion.hora}</Text>
            </View>

            {!notificacion.leida && <View style={styles.puntoNuevo} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    padding: 16,
    gap: 10,
  },

  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  tarjetaNueva: {
    borderColor: paletaColores.boton,
  },

  icono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F5EC",
  },

  textos: {
    flex: 1,
  },

  titulo: {
    fontSize: 15,
    fontWeight: "700",
    color: paletaColores.textoClaro,
  },

  mensaje: {
    fontSize: 13,
    marginTop: 2,
    color: paletaColores.textoSecundarioClaro,
  },

  hora: {
    fontSize: 12,
    marginTop: 4,
    color: paletaColores.textoSecundarioClaro,
  },

  puntoNuevo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: paletaColores.error,
  },
});
