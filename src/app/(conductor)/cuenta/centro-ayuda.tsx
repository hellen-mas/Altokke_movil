import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { paletaColores } from "@/paletaColores";

interface PreguntaProps {
  pregunta: string;
  respuesta: string;
}

function PreguntaFrecuente({
  pregunta,
  respuesta,
}: PreguntaProps) {
  const [abierta, setAbierta] = useState(false);

  return (
    <Pressable
      style={styles.pregunta}
      onPress={() => setAbierta(!abierta)}
    >
      <View style={styles.preguntaSuperior}>
        <Text style={styles.preguntaTitulo}>
          {pregunta}
        </Text>

        <Ionicons
          name={
            abierta
              ? "chevron-up"
              : "chevron-down"
          }
          size={18}
          color={paletaColores.textoSecundarioClaro}
        />
      </View>

      {abierta && (
        <Text style={styles.respuesta}>
          {respuesta}
        </Text>
      )}
    </Pressable>
  );
}

export default function CentroAyudaConductor() {
  const contactarSoporte = () => {
    Alert.alert(
      "Soporte Altokke",
      "Más adelante esta opción permitirá comunicarte directamente con soporte."
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CabeceraConductor
          titulo="Centro de ayuda"
          subtitulo="Encuentra respuestas y recibe asistencia"
          mostrarAtras
          compacta
        />

        <View style={styles.introCard}>
          <View style={styles.introIcono}>
            <Ionicons
              name="help-circle-outline"
              size={28}
              color={paletaColores.verde}
            />
          </View>

          <View style={styles.introInformacion}>
            <Text style={styles.introTitulo}>
              ¿Cómo podemos ayudarte?
            </Text>

            <Text style={styles.introDescripcion}>
              Consulta las preguntas más frecuentes sobre tu cuenta,
              viajes y seguridad.
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Temas frecuentes
          </Text>

          <View style={styles.temasCard}>
            <View style={styles.tema}>
              <View style={styles.temaIcono}>
                <Ionicons
                  name="person-outline"
                  size={19}
                  color={paletaColores.verde}
                />
              </View>

              <View style={styles.temaInfo}>
                <Text style={styles.temaTitulo}>
                  Cuenta y perfil
                </Text>
                <Text style={styles.temaDescripcion}>
                  Información personal y configuración.
                </Text>
              </View>
            </View>

            <View style={styles.tema}>
              <View style={styles.temaIcono}>
                <Ionicons
                  name="car-outline"
                  size={19}
                  color={paletaColores.verde}
                />
              </View>

              <View style={styles.temaInfo}>
                <Text style={styles.temaTitulo}>
                  Viajes y solicitudes
                </Text>
                <Text style={styles.temaDescripcion}>
                  Ayuda durante y después de un viaje.
                </Text>
              </View>
            </View>

            <View style={[styles.tema, styles.ultimo]}>
              <View style={styles.temaIcono}>
                <Ionicons
                  name="document-text-outline"
                  size={19}
                  color={paletaColores.verde}
                />
              </View>

              <View style={styles.temaInfo}>
                <Text style={styles.temaTitulo}>
                  Documentos
                </Text>
                <Text style={styles.temaDescripcion}>
                  Verificación, SOAT y licencia.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            Preguntas frecuentes
          </Text>

          <View style={styles.preguntasCard}>
            <PreguntaFrecuente
              pregunta="¿Por qué un documento aparece en revisión?"
              respuesta="Significa que Altokke todavía está validando la información enviada. Cuando termine la revisión, su estado será actualizado."
            />

            <PreguntaFrecuente
              pregunta="¿Qué ocurre si cambio los datos de mi vehículo?"
              respuesta="Algunos cambios pueden requerir una nueva verificación antes de continuar conduciendo."
            />

            <PreguntaFrecuente
              pregunta="¿Cómo puedo reportar un problema durante un viaje?"
              respuesta="Puedes utilizar la opción Reportar incidente dentro de la sección Seguridad."
            />

            <PreguntaFrecuente
              pregunta="¿Cómo cambio mi contraseña?"
              respuesta="Puedes hacerlo desde Seguridad, en la opción Cambiar contraseña o PIN."
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.botonSoporte,
            pressed && styles.botonPresionado,
          ]}
          onPress={contactarSoporte}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={paletaColores.textoOscuro}
          />

          <Text style={styles.botonTexto}>
            Contactar soporte
          </Text>
        </Pressable>

        <View style={styles.avisoContainer}>
          <AvisoInformativo
            icono="information-circle-outline"
            titulo="Estamos para ayudarte"
            texto="Si no encuentras una respuesta, puedes comunicarte con el equipo de soporte de Altokke."
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

  introCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    marginTop: 16,
    padding: 15,
    gap: 12,
    borderRadius: 17,
    backgroundColor: "#E8F4ED",
  },

  introIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  introInformacion: {
    flex: 1,
  },

  introTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 14,
    fontWeight: "800",
  },

  introDescripcion: {
    marginTop: 3,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 10,
    lineHeight: 15,
  },

  seccion: {
    marginHorizontal: 18,
    marginTop: 18,
  },

  tituloSeccion: {
    marginBottom: 8,
    color: paletaColores.textoClaro,
    fontSize: 13,
    fontWeight: "800",
  },

  temasCard: {
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 17,
    backgroundColor: paletaColores.superficieClara,
    overflow: "hidden",
  },

  tema: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1EF",
  },

  ultimo: {
    borderBottomWidth: 0,
  },

  temaIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4ED",
  },

  temaInfo: {
    flex: 1,
  },

  temaTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 12,
    fontWeight: "700",
  },

  temaDescripcion: {
    marginTop: 2,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 9,
  },

  preguntasCard: {
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 17,
    backgroundColor: paletaColores.superficieClara,
    overflow: "hidden",
  },

  pregunta: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1EF",
  },

  preguntaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  preguntaTitulo: {
    flex: 1,
    color: paletaColores.textoClaro,
    fontSize: 11,
    fontWeight: "700",
  },

  respuesta: {
    marginTop: 8,
    paddingRight: 24,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 10,
    lineHeight: 15,
  },

  botonSoporte: {
    height: 48,
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: paletaColores.boton,
  },

  botonPresionado: {
    backgroundColor: paletaColores.botonPresionado,
  },

  botonTexto: {
    color: paletaColores.textoOscuro,
    fontSize: 13,
    fontWeight: "700",
  },

  avisoContainer: {
    marginHorizontal: 18,
  },
});