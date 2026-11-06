
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

type NombreIcono = keyof typeof Ionicons.glyphMap;

interface ElementoInformacion {
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
}

const DATOS: ElementoInformacion[] = [
  {
    titulo: "Datos personales",
    descripcion:
      "Nombre, información de contacto y datos registrados para identificar tu cuenta.",
    icono: "person-outline",
  },
  {
    titulo: "Ubicación",
    descripcion:
      "Ubicación utilizada para seleccionar puntos de recogida y destinos.",
    icono: "location-outline",
  },
  {
    titulo: "Historial de viajes",
    descripcion:
      "Información sobre las solicitudes y viajes asociados a tu cuenta.",
    icono: "car-outline",
  },
];

export default function Privacidad() {
  const { colores } = useAltokkeTheme();

  return (
    <View
      style={[
        styles.pantalla,
        { backgroundColor: colores.fondo },
      ]}
    >
      <EncabezadoPantalla titulo="Privacidad y datos" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {/* Introducción */}
        <View
          style={[
            styles.presentacion,
            { backgroundColor: colores.exitoFondo },
          ]}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={30}
            color={colores.exitoTexto}
          />

          <Text
            style={[
              styles.tituloPresentacion,
              { color: colores.texto },
            ]}
          >
            Tu información importa
          </Text>

          <Text
            style={[
              styles.descripcionPresentacion,
              { color: colores.secundario },
            ]}
          >
            Conoce qué información utiliza Altokke y
            cómo puedes administrar tus datos.
          </Text>
        </View>

        {/* Datos personales */}
        <Text
          style={[
            styles.tituloSeccion,
            { color: colores.secundario },
          ]}
        >
          TU INFORMACIÓN
        </Text>

        <View
          style={[
            styles.tarjeta,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          {DATOS.map((item, index) => (
            <View key={item.titulo}>
              <View style={styles.fila}>
                <Ionicons
                  name={item.icono}
                  size={21}
                  color={colores.exitoTexto}
                />

                <View style={styles.textos}>
                  <Text
                    style={[
                      styles.tituloFila,
                      { color: colores.texto },
                    ]}
                  >
                    {item.titulo}
                  </Text>

                  <Text
                    style={[
                      styles.descripcionFila,
                      { color: colores.secundario },
                    ]}
                  >
                    {item.descripcion}
                  </Text>
                </View>
              </View>

              {index !== DATOS.length - 1 && (
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

        {/* Control de información */}
        <Text
          style={[
            styles.tituloSeccion,
            { color: colores.secundario },
          ]}
        >
          CONTROLA TUS DATOS
        </Text>

        <View
          style={[
            styles.tarjeta,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <Pressable
            style={styles.fila}
            onPress={() =>
              router.push("/cuenta/informacion-personal")
            }
            accessibilityRole="button"
          >
            <Ionicons
              name="document-text-outline"
              size={21}
              color={colores.exitoTexto}
            />

            <View style={styles.textos}>
              <Text
                style={[
                  styles.tituloFila,
                  { color: colores.texto },
                ]}
              >
                Consultar mis datos
              </Text>

              <Text
                style={[
                  styles.descripcionFila,
                  { color: colores.secundario },
                ]}
              >
                Revisa la información de tu perfil.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colores.secundario}
            />
          </Pressable>

          <View
            style={[
              styles.separador,
              { backgroundColor: colores.linea },
            ]}
          />

          <Pressable
            style={styles.fila}
            onPress={() => router.push("/ayuda")}
            accessibilityRole="button"
          >
            <Ionicons
              name="create-outline"
              size={21}
              color={colores.exitoTexto}
            />

            <View style={styles.textos}>
              <Text
                style={[
                  styles.tituloFila,
                  { color: colores.texto },
                ]}
              >
                Solicitar una corrección
              </Text>

              <Text
                style={[
                  styles.descripcionFila,
                  { color: colores.secundario },
                ]}
              >
                Contacta a soporte para consultar cómo
                rectificar información protegida.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colores.secundario}
            />
          </Pressable>

          <View
            style={[
              styles.separador,
              { backgroundColor: colores.linea },
            ]}
          />

          <Pressable
            style={styles.fila}
            onPress={() =>
              router.push("/cuenta/configuracion")
            }
            accessibilityRole="button"
          >
            <Ionicons
              name="trash-outline"
              size={21}
              color={colores.error}
            />

            <View style={styles.textos}>
              <Text
                style={[
                  styles.tituloFila,
                  { color: colores.error },
                ]}
              >
                Solicitar eliminación
              </Text>

              <Text
                style={[
                  styles.descripcionFila,
                  { color: colores.secundario },
                ]}
              >
                Consulta la opción Eliminar cuenta
                desde Configuración.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colores.secundario}
            />
          </Pressable>
        </View>

        {/* Nota informativa */}
        <View style={styles.aviso}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colores.secundario}
          />

          <Text
            style={[
              styles.textoAviso,
              { color: colores.secundario },
            ]}
          >
            Esta sección ofrece información general
            sobre tus datos. Las solicitudes formales
            y la política de privacidad deberán
            gestionarse mediante los canales oficiales
            que establezca Altokke.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },

  contenido: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },

  presentacion: {
    padding: 20,
    borderRadius: 20,
    gap: 10,
    marginBottom: 10,
  },

  tituloPresentacion: {
    fontSize: 18,
    fontWeight: "700",
  },

  descripcionPresentacion: {
    fontSize: 13,
    lineHeight: 20,
  },

  tituloSeccion: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },

  tarjeta: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  textos: {
    flex: 1,
    gap: 4,
  },

  tituloFila: {
    fontSize: 14,
    fontWeight: "600",
  },

  descripcionFila: {
    fontSize: 12,
    lineHeight: 18,
  },

  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
    marginRight: 16,
  },

  aviso: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
  },

  textoAviso: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },
});
