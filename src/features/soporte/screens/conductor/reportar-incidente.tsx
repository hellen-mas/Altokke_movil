import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "@/shared/api/supabase";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { AvisoInformativo } from "@/shared/components/ui";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

type TipoIncidente =
  | "SEGURIDAD"
  | "PASAJERO"
  | "PAGO"
  | "VEHICULO"
  | "OTRO";

export default function ReportarIncidenteConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
  const [tipo, setTipo] =
    useState<TipoIncidente | null>(null);

  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviarReporte = async () => {
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
        "Escribe una descripción un poco más detallada (al menos 10 caracteres)."
      );
      return;
    }

    setEnviando(true);
    try {
      const { error } = await (supabase.rpc as any)("reportar_incidente", {
        p_tipo: tipo,
        p_descripcion: descripcion.trim(),
      });

      if (error) {
        // Fallback si la migración aún no se sincronizó
        const { error: errDirect } = await (supabase.from as any)("auditoria_logs").insert({
          accion: "INCIDENTE_REPORTADO",
          entidad: "soporte_incidentes",
          detalles: {
            tipo,
            descripcion: descripcion.trim(),
            reportado_en: new Date().toISOString(),
          },
        });
        if (errDirect) throw error;
      }

      Alert.alert(
        "Reporte enviado",
        "Tu reporte fue registrado en el sistema de Altokke con éxito. El equipo de soporte lo revisará a la brevedad."
      );

      setTipo(null);
      setDescripcion("");
    } catch (err: any) {
      Alert.alert(
        "No se pudo enviar",
        err?.message || "Ocurrió un error al enviar el reporte. Por favor inténtalo de nuevo."
      );
    } finally {
      setEnviando(false);
    }
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
      <CabeceraConductor
          titulo="Reportar incidente"
          mostrarAtras
          compacta
        />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
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
                        ? c.primario
                        : c.textoSec
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
                      color={c.primario}
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
              c.textoSec
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
              (pressed || enviando) && styles.botonPresionado,
              enviando && { opacity: 0.7 },
            ]}
            onPress={enviarReporte}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name="send-outline"
                  size={18}
                  color={"#FFFFFF"}
                />
                <Text style={styles.botonTexto}>
                  Enviar reporte
                </Text>
              </>
            )}
          </Pressable>
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

  contenido: {
    marginHorizontal: 18,
    marginTop: 18,
  },

  tituloSeccion: {
    marginBottom: 9,
    color: c.texto,
    fontSize: 15,
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
    borderColor: c.borde,
    backgroundColor: c.superficie,
  },

  opcionSeleccionada: {
    borderColor: c.primario,
    backgroundColor: c.primarioSuave,
  },

  opcionTexto: {
    flex: 1,
    color: c.texto,
    fontSize: 14,
    fontWeight: "600",
  },

  opcionTextoSeleccionado: {
    color: c.primario,
    fontWeight: "700",
  },

  tituloDescripcion: {
    marginTop: 20,
    marginBottom: 9,
    color: c.texto,
    fontSize: 15,
    fontWeight: "800",
  },

  textArea: {
    minHeight: 145,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: c.borde,
    backgroundColor: c.superficie,
    color: c.texto,
    fontSize: 13,
    lineHeight: 18,
  },

  contador: {
    marginTop: 5,
    textAlign: "right",
    color: c.textoSec,
    fontSize: 10,
  },

  botonEnviar: {
    height: 49,
    marginTop: 4,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: c.primario,
  },

  botonPresionado: {
    backgroundColor: c.primarioPresionado,
  },

  botonTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
