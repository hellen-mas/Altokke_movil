import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { paletaColores } from "@/paletaColores";

type TipoIncidente =
  | "SEGURIDAD"
  | "PASAJERO"
  | "PAGO"
  | "VEHICULO"
  | "OTRO";

export default function ReportarIncidenteConductor() {
  const [tipo, setTipo] =
    useState<TipoIncidente | null>(null);

  const [descripcion, setDescripcion] = useState("");

  const enviarReporte = () => {
    if (!tipo) {
      Alert.alert(
        "Selecciona un tipo",
        "Indica qué tipo de incidente deseas reportar."
      );
      return;
    }

    if (descripcion.trim().length < 10) {
      Alert.alert(
        "Describe el incidente",
        "Escribe una descripción un poco más detallada."
      );
      return;
    }

    Alert.alert(
      "Reporte enviado",
      "Tu reporte fue registrado correctamente. El equipo de Altokke podrá revisarlo."
    );

    setTipo(null);
    setDescripcion("");
  };

  const opciones: {
    tipo: TipoIncidente;
    titulo: string;
    icono: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      tipo: "SEGURIDAD",
      titulo: "Seguridad",
      icono: "shield-outline",
    },
    {
      tipo: "PASAJERO",
      titulo: "Problema con pasajero",
      icono: "person-outline",
    },
    {
      tipo: "PAGO",
      titulo: "Pago o tarifa",
      icono: "cash-outline",
    },
    {
      tipo: "VEHICULO",
      titulo: "Vehículo",
      icono: "car-outline",
    },
    {
      tipo: "OTRO",
      titulo: "Otro",
      icono: "ellipsis-horizontal-outline",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CabeceraConductor
          titulo="Reportar incidente"
          subtitulo="Cuéntanos qué ocurrió"
          mostrarAtras
          compacta
        />

        <View style={styles.contenido}>
          <Text style={styles.tituloSeccion}>
            Tipo de incidente
          </Text>

          <View style={styles.opciones}>
            {opciones.map((opcion) => {
              const seleccionado =
                tipo === opcion.tipo;

              return (
                <Pressable
                  key={opcion.tipo}
                  style={[
                    styles.opcion,
                    seleccionado &&
                      styles.opcionSeleccionada,
                  ]}
                  onPress={() =>
                    setTipo(opcion.tipo)
                  }
                >
                  <Ionicons
                    name={opcion.icono}
                    size={20}
                    color={
                      seleccionado
                        ? paletaColores.verde
                        : paletaColores.textoSecundarioClaro
                    }
                  />

                  <Text
                    style={[
                      styles.opcionTexto,
                      seleccionado &&
                        styles.opcionTextoSeleccionado,
                    ]}
                  >
                    {opcion.titulo}
                  </Text>

                  {seleccionado && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={paletaColores.verde}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.tituloDescripcion}>
            Describe lo ocurrido
          </Text>

          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Explícanos brevemente qué sucedió..."
            placeholderTextColor={
              paletaColores.textoSecundarioClaro
            }
            multiline
            maxLength={600}
            textAlignVertical="top"
            style={styles.textArea}
          />

          <Text style={styles.contador}>
            {descripcion.length}/600
          </Text>

          <AvisoInformativo
            icono="shield-checkmark-outline"
            titulo="Tu reporte es confidencial"
            texto="La información enviada será utilizada únicamente para investigar y atender el incidente."
          />

          <Pressable
            style={({ pressed }) => [
              styles.botonEnviar,
              pressed && styles.botonPresionado,
            ]}
            onPress={enviarReporte}
          >
            <Ionicons
              name="send-outline"
              size={18}
              color={paletaColores.textoOscuro}
            />

            <Text style={styles.botonTexto}>
              Enviar reporte
            </Text>
          </Pressable>
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

  contenido: {
    marginHorizontal: 18,
    marginTop: 18,
  },

  tituloSeccion: {
    marginBottom: 9,
    color: paletaColores.textoClaro,
    fontSize: 13,
    fontWeight: "800",
  },

  opciones: {
    gap: 8,
  },

  opcion: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },

  opcionSeleccionada: {
    borderColor: paletaColores.verde,
    backgroundColor: "#E8F4ED",
  },

  opcionTexto: {
    flex: 1,
    color: paletaColores.textoClaro,
    fontSize: 11,
    fontWeight: "600",
  },

  opcionTextoSeleccionado: {
    color: paletaColores.verde,
    fontWeight: "700",
  },

  tituloDescripcion: {
    marginTop: 20,
    marginBottom: 9,
    color: paletaColores.textoClaro,
    fontSize: 13,
    fontWeight: "800",
  },

  textArea: {
    minHeight: 145,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
    color: paletaColores.textoClaro,
    fontSize: 12,
    lineHeight: 18,
  },

  contador: {
    marginTop: 5,
    textAlign: "right",
    color: paletaColores.textoSecundarioClaro,
    fontSize: 9,
  },

  botonEnviar: {
    height: 49,
    marginTop: 4,
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
});