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
import { CONDUCTOR_EJEMPLO } from "@/constants/conductor";
import { paletaColores } from "@/paletaColores";

type EstadoDocumento =
  | "VERIFICADO"
  | "EN_REVISION"
  | "PENDIENTE";

interface DocumentoEstadoProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  estado: EstadoDocumento;
  onPress: () => void;
}

function DocumentoEstado({
  icono,
  titulo,
  descripcion,
  estado,
  onPress,
}: DocumentoEstadoProps) {
  const obtenerEstado = () => {
    switch (estado) {
      case "VERIFICADO":
        return {
          texto: "Verificado",
          icono: "checkmark-circle" as const,
          color: paletaColores.verde,
          fondo: "#E5F6ED",
        };

      case "EN_REVISION":
        return {
          texto: "En revisión",
          icono: "time-outline" as const,
          color: "#C88A20",
          fondo: "#FFF3DB",
        };

      case "PENDIENTE":
        return {
          texto: "Pendiente",
          icono: "alert-circle-outline" as const,
          color: "#D65353",
          fondo: "#FDE8E8",
        };
    }
  };

  const estadoVisual = obtenerEstado();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.documentoFila,
        pressed && styles.documentoPresionado,
      ]}
    >
      <View style={styles.documentoIcono}>
        <Ionicons
          name={icono}
          size={21}
          color={paletaColores.verde}
        />
      </View>

      <View style={styles.documentoInformacion}>
        <Text style={styles.documentoTitulo}>
          {titulo}
        </Text>

        <Text style={styles.documentoDescripcion}>
          {descripcion}
        </Text>
      </View>

      <View
        style={[
          styles.estadoContainer,
          {
            backgroundColor: estadoVisual.fondo,
          },
        ]}
      >
        <Ionicons
          name={estadoVisual.icono}
          size={14}
          color={estadoVisual.color}
        />

        <Text
          style={[
            styles.estadoTexto,
            {
              color: estadoVisual.color,
            },
          ]}
        >
          {estadoVisual.texto}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={paletaColores.textoSecundarioClaro}
      />
    </Pressable>
  );
}

export default function DocumentosConductor() {
  const documentos = CONDUCTOR_EJEMPLO.documentos;

  const verDocumento = (nombre: string) => {
    Alert.alert(
      nombre,
      "Más adelante aquí podrás revisar el documento, consultar su estado o reemplazarlo."
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cabecera */}
        <CabeceraConductor
          titulo="Documentos"
          subtitulo="Mantén tu documentación actualizada"
          mostrarAtras
          compacta
        />

        {/* Introducción */}
        <View style={styles.introduccion}>
          <View style={styles.introduccionTexto}>
            <Text style={styles.tituloPrincipal}>
              Tu documentación{"\n"}
              <Text style={styles.tituloVerde}>
                al día
              </Text>
            </Text>

            <Text style={styles.descripcionPrincipal}>
              Mantén tus documentos actualizados para seguir
              conduciendo con Altokke.
            </Text>
          </View>

          <View style={styles.ilustracion}>
            <Ionicons
              name="document-text-outline"
              size={46}
              color={paletaColores.verde}
            />

            <View style={styles.checkIlustracion}>
              <Ionicons
                name="checkmark"
                size={17}
                color="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.resumenCard}>
          <View style={styles.progresoCircular}>
            <Text style={styles.progresoNumero}>
              5 de 5
            </Text>

            <Text style={styles.progresoTexto}>
              documentos{"\n"}cargados
            </Text>
          </View>

          <View style={styles.resumenInformacion}>
            <Text style={styles.resumenTitulo}>
              ¡Todo en orden!
            </Text>

            <Text style={styles.resumenDescripcion}>
              Has completado todos los documentos requeridos.
            </Text>

            <Pressable
              style={styles.botonDetalle}
              onPress={() =>
                Alert.alert(
                  "Resumen de documentación",
                  "Actualmente tienes 5 de 5 documentos cargados."
                )
              }
            >
              <Ionicons
                name="eye-outline"
                size={15}
                color={paletaColores.verde}
              />

              <Text style={styles.botonDetalleTexto}>
                Ver detalle
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Lista de documentos */}
        <View style={styles.listaDocumentos}>
          <DocumentoEstado
            icono="id-card-outline"
            titulo="DNI o documento de identidad"
            descripcion="Tu documento de identidad."
            estado={
              documentos.dni.estado as EstadoDocumento
            }
            onPress={() =>
              verDocumento("DNI o documento de identidad")
            }
          />

          <DocumentoEstado
            icono="car-outline"
            titulo="Licencia de conducir"
            descripcion="Tu licencia vigente."
            estado={
              documentos.licencia.estado as EstadoDocumento
            }
            onPress={() =>
              verDocumento("Licencia de conducir")
            }
          />

          <DocumentoEstado
            icono="document-text-outline"
            titulo="SOAT"
            descripcion="Seguro obligatorio contra accidentes."
            estado={
              documentos.soat.estado as EstadoDocumento
            }
            onPress={() =>
              verDocumento("SOAT")
            }
          />

          <DocumentoEstado
            icono="car-sport-outline"
            titulo="Tarjeta de propiedad"
            descripcion="Documento de tu vehículo."
            estado={
              documentos.tarjetaPropiedad
                .estado as EstadoDocumento
            }
            onPress={() =>
              verDocumento("Tarjeta de propiedad")
            }
          />

          <DocumentoEstado
            icono="shield-checkmark-outline"
            titulo="Antecedentes penales"
            descripcion="Certificado de antecedentes penales."
            estado={
              documentos.antecedentesPenales
                .estado as EstadoDocumento
            }
            onPress={() =>
              verDocumento("Antecedentes penales")
            }
          />
        </View>

        {/* Aviso */}
        <View style={styles.avisoContainer}>
          <AvisoInformativo
            icono="shield-checkmark-outline"
            titulo="Tu información está segura"
            texto="Todos tus documentos son procesados de forma segura y confidencial."
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

  introduccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 17,
  },

  introduccionTexto: {
    flex: 1,
    paddingRight: 15,
  },

  tituloPrincipal: {
    color: paletaColores.textoClaro,
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 25,
  },

  tituloVerde: {
    color: paletaColores.verde,
  },

  descripcionPrincipal: {
    marginTop: 7,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 11,
    lineHeight: 16,
  },

  ilustracion: {
    width: 82,
    height: 82,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F5ED",
  },

  checkIlustracion: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.verde,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  resumenCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    marginTop: 18,
    padding: 15,
    gap: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },

  progresoCircular: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 7,
    borderColor: paletaColores.verde,
    backgroundColor: "#FFFFFF",
  },

  progresoNumero: {
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "800",
  },

  progresoTexto: {
    marginTop: 1,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 8,
    lineHeight: 10,
    textAlign: "center",
  },

  resumenInformacion: {
    flex: 1,
  },

  resumenTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "800",
  },

  resumenDescripcion: {
    marginTop: 3,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 10,
    lineHeight: 14,
  },

  botonDetalle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: "#E8F4ED",
  },

  botonDetalleTexto: {
    color: paletaColores.verde,
    fontSize: 10,
    fontWeight: "700",
  },

  listaDocumentos: {
    marginHorizontal: 18,
    marginTop: 16,
    gap: 9,
  },

  documentoFila: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
  },

  documentoPresionado: {
    backgroundColor: "#F6F8F7",
  },

  documentoIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4ED",
  },

  documentoInformacion: {
    flex: 1,
  },

  documentoTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 11,
    fontWeight: "700",
  },

  documentoDescripcion: {
    marginTop: 2,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 8,
    lineHeight: 11,
  },

  estadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },

  estadoTexto: {
    fontSize: 8,
    fontWeight: "700",
  },

  avisoContainer: {
    marginHorizontal: 18,
    marginTop: 3,
  },
});