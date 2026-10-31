import { CabeceraFlujoViaje } from "@/features/viajes/components/CabeceraFlujoViaje";
import { TarjetaConductor } from "@/features/viajes/components/TarjetaConductor";
import { useViaje } from "@/features/viajes/context/ViajeContext";
import { useResumenViaje } from "@/features/viajes/hooks/use-resumen-viaje";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { viajeService } from "@/features/viajes/services/viajeService";
import {
  formatearHora,
  formatearSoles,
  NOMBRE_METODO_PAGO,
} from "@/features/viajes/utils/viaje";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_COMENTARIO = 500;
const COLOR_ESTRELLA = "#F5B301";

const ETIQUETAS: {
  id: string;
  texto: string;
  icono: keyof typeof Ionicons.glyphMap;
}[] = [
    { id: "puntual", texto: "Puntual", icono: "time-outline" },
    { id: "amable", texto: "Amable", icono: "happy-outline" },
    { id: "seguro", texto: "Conducción segura", icono: "shield-checkmark-outline" },
    { id: "limpio", texto: "Vehículo limpio", icono: "sparkles-outline" },
    { id: "ruta", texto: "Buena ruta", icono: "map-outline" },
  ];

const TEXTO_CALIFICACION = [
  "",
  "Muy malo",
  "Malo",
  "Regular",
  "Bueno",
  "¡Excelente!",
];

function Estrellas({
  valor,
  tamano,
  colorInactivo = "#D1D5DB",
  onCambiar,
}: {
  valor: number;
  tamano: number;
  colorInactivo?: string;
  onCambiar?: (estrellas: number) => void;
}) {
  return (
    <View style={styles.estrellas}>
      {[1, 2, 3, 4, 5].map((numero) => (
        <Pressable
          key={numero}
          disabled={!onCambiar}
          onPress={() => onCambiar?.(numero)}
          hitSlop={6}
        >
          <Ionicons
            name={numero <= valor ? "star" : "star-outline"}
            size={tamano}
            color={numero <= valor ? COLOR_ESTRELLA : colorInactivo}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function PantallaCalificacion() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { setDestino, registrarViaje, viajeActivoId, setViajeActivoId } = useViaje();
  const resumen = useResumenViaje();
  const insets = useSafeAreaInsets();
  const [fecha] = useState(() => new Date());
  const [estrellas, setEstrellas] = useState(0);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);

  // Si se entra sin haber hecho un viaje, se vuelve al inicio
  if (!resumen) {
    return <Redirect href="/mapa" />;
  }

  const { origenLugar, destino, tarifa, metodoPago } = resumen;

  const alternarEtiqueta = (id: string) => {
    setEtiquetas((actuales) =>
      actuales.includes(id)
        ? actuales.filter((etiqueta) => etiqueta !== id)
        : [...actuales, id],
    );
  };

  const guardarViaje = (calificacion?: number) => {
    registrarViaje({
      origen: origenLugar.nombre,
      destino: destino.nombre,
      lugarDestino: destino,
      tarifa,
      estado: "completado",
      calificacion,
    });
  };

  const irAlInicio = () => {
    setViajeActivoId(null);
    router.replace("/mapa");
    setDestino(null);
  };

  const enviarCalificacion = async () => {
    guardarViaje(estrellas);
    if (viajeActivoId && userId) {
      try {
        await viajeService.registrarCalificacion(
          viajeActivoId,
          userId,
          null,
          estrellas,
          comentario
        );
      } catch (err) {
        console.warn("Aviso al registrar calificación:", err);
      }
    }
    setEnviado(true);
  };

  const omitir = () => {
    guardarViaje();
    irAlInicio();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.pantalla, { backgroundColor: colores.fondo }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <CabeceraFlujoViaje
          titulo="Califica tu viaje"
          subtitulo="Cuéntanos cómo fue tu experiencia"
          mostrarRegreso={false}
        />

        {/* Viaje finalizado */}
        <View
          style={[
            styles.finalizado,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={34}
            color={colores.exitoTexto}
          />
          <View style={styles.finalizadoTextos}>
            <Text
              style={[styles.finalizadoTitulo, { color: colores.texto }]}
            >
              Viaje finalizado
            </Text>
            <Text style={[styles.detalle, { color: colores.secundario }]}>
              Gracias por viajar con Altokke
            </Text>
          </View>
          <View style={styles.finalizadoFecha}>
            <Text
              style={[
                styles.insignia,
                {
                  backgroundColor: colores.exitoFondo,
                  color: colores.exitoTexto,
                },
              ]}
            >
              Completado
            </Text>
            <Text style={[styles.detalle, { color: colores.secundario }]}>
              Hoy, {formatearHora(fecha)}
            </Text>
          </View>
        </View>

        {enviado ? (
          <View style={styles.gracias}>
            <View
              style={[
                styles.graciasIcono,
                { backgroundColor: colores.exitoFondo },
              ]}
            >
              <Ionicons name="heart" size={40} color={colores.exitoTexto} />
            </View>
            <Text style={[styles.graciasTitulo, { color: colores.texto }]}>
              ¡Gracias por calificar!
            </Text>
            <Text style={[styles.graciasTexto, { color: colores.secundario }]}>
              Tu opinión ayuda a mejorar Altokke.
            </Text>
            <Estrellas
              valor={estrellas}
              tamano={30}
              colorInactivo={colores.linea}
            />
          </View>
        ) : (
          <>
            {/* Resumen del viaje */}
            <Text style={[styles.seccion, { color: colores.texto }]}>
              Resumen del viaje
            </Text>
            <View
              style={[
                styles.tarjetaResumen,
                {
                  backgroundColor: colores.campo,
                  borderColor: colores.linea,
                },
              ]}
            >
              <View style={styles.recorrido}>
                <View style={styles.filaLugar}>
                  <Ionicons
                    name="radio-button-on"
                    size={18}
                    color={colores.exitoTexto}
                  />
                  <Text
                    style={[styles.lugar, { color: colores.texto }]}
                    numberOfLines={1}
                  >
                    {origenLugar.nombre}
                  </Text>
                </View>
                <View style={styles.filaLugar}>
                  <Ionicons
                    name="location-sharp"
                    size={18}
                    color={colores.error}
                  />
                  <Text
                    style={[styles.lugar, { color: colores.texto }]}
                    numberOfLines={1}
                  >
                    {destino.nombre}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.tarifaFinal,
                  { borderLeftColor: colores.linea },
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={colores.exitoTexto}
                />
                <Text
                  style={[styles.tarifaValor, { color: colores.texto }]}
                >
                  {formatearSoles(tarifa)}
                </Text>
                <Text style={[styles.detalle, { color: colores.secundario }]}>
                  {metodoPago === "efectivo"
                    ? "Pago en efectivo"
                    : `Pago con ${NOMBRE_METODO_PAGO[metodoPago]}`}
                </Text>
              </View>
            </View>

            <Text style={[styles.seccion, { color: colores.texto }]}>
              Tu conductor
            </Text>
            <TarjetaConductor />

            {/* Calificación */}
            <Text style={[styles.pregunta, { color: colores.texto }]}>
              ¿Cómo fue tu viaje?
            </Text>
            <Text style={[styles.detalle, { color: colores.secundario }]}>
              Tu opinión ayuda a mejorar Altokke
            </Text>

            <View style={styles.calificar}>
              <Estrellas
                valor={estrellas}
                tamano={40}
                colorInactivo={colores.progresoInactivo}
                onCambiar={setEstrellas}
              />
              <Text
                style={[
                  styles.textoCalificacion,
                  { color: colores.secundario },
                ]}
              >
                {TEXTO_CALIFICACION[estrellas] || "Toca una estrella"}
              </Text>
            </View>

            <View style={styles.etiquetas}>
              {ETIQUETAS.map((etiqueta) => {
                const activa = etiquetas.includes(etiqueta.id);

                return (
                  <Pressable
                    key={etiqueta.id}
                    onPress={() => alternarEtiqueta(etiqueta.id)}
                    style={[
                      styles.etiqueta,
                      {
                        backgroundColor: activa
                          ? colores.primario
                          : colores.campo,
                        borderColor: activa
                          ? colores.primario
                          : colores.linea,
                      },
                    ]}
                  >
                    <Ionicons
                      name={etiqueta.icono}
                      size={16}
                      color={
                        activa
                          ? colores.textoBoton
                          : colores.secundario
                      }
                    />
                    <Text
                      style={[
                        styles.etiquetaTexto,
                        {
                          color: activa
                            ? colores.textoBoton
                            : colores.texto,
                        },
                      ]}
                    >
                      {etiqueta.texto}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Comentario */}
            <Text style={[styles.seccion, { color: colores.texto }]}>
              Deja un comentario (opcional)
            </Text>
            <View
              style={[
                styles.comentario,
                {
                  backgroundColor: colores.campo,
                  borderColor: colores.linea,
                },
              ]}
            >
              <TextInput
                value={comentario}
                onChangeText={setComentario}
                placeholder="Cuéntanos cómo fue tu viaje..."
                placeholderTextColor={colores.secundario}
                multiline
                maxLength={MAX_COMENTARIO}
                style={[styles.comentarioInput, { color: colores.texto }]}
              />
              <Text style={[styles.contador, { color: colores.secundario }]}>
                {comentario.length}/{MAX_COMENTARIO}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.pie,
          {
            borderTopColor: colores.linea,
            backgroundColor: colores.superficie,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        {enviado ? (
          <BotonPrincipal titulo="Volver al inicio" onPress={irAlInicio} />
        ) : (
          <>
            <Pressable
              onPress={enviarCalificacion}
              disabled={estrellas === 0}
              style={({ pressed }) => [
                styles.botonEnviar,
                {
                  backgroundColor:
                    estrellas === 0
                      ? colores.progresoInactivo
                      : colores.primario,
                },
                pressed && { backgroundColor: colores.primarioPresionado },
              ]}
            >
              <Ionicons
                name="paper-plane"
                size={20}
                color={colores.textoBoton}
              />
              <Text
                style={[
                  styles.botonEnviarTexto,
                  { color: colores.textoBoton },
                ]}
              >
                Enviar calificación
              </Text>
            </Pressable>

            <Pressable onPress={omitir} hitSlop={8}>
              <Text style={[styles.omitir, { color: colores.secundario }]}>
                Omitir
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },

  contenido: {
    paddingBottom: 20,
  },

  finalizado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },

  finalizadoTextos: {
    flex: 1,
  },

  finalizadoTitulo: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  finalizadoFecha: {
    alignItems: "flex-end",
    gap: 2,
  },

  insignia: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  detalle: {
    fontSize: 12,
  },

  seccion: {
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "800",
  },

  tarjetaResumen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },

  recorrido: {
    flex: 1,
    gap: 16,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  lugar: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },

  tarifaFinal: {
    alignItems: "center",
    gap: 2,
    paddingLeft: 12,
    borderLeftWidth: 1,
  },

  tarifaValor: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  pregunta: {
    marginTop: 20,
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: "800",
  },

  calificar: {
    alignItems: "center",
    gap: 12,
    marginTop: 22,
    marginBottom: 8,
  },

  estrellas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  textoCalificacion: {
    fontSize: 14,
    fontWeight: "700",
  },

  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
    marginHorizontal: 16,
  },

  etiqueta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
  },

  etiquetaTexto: {
    fontSize: 13,
    fontWeight: "600",
  },

  comentario: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },

  comentarioInput: {
    minHeight: 90,
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: "top",
  },

  contador: {
    alignSelf: "flex-end",
    fontSize: 11,
  },

  gracias: {
    alignItems: "center",
    gap: 8,
    marginTop: 40,
    marginHorizontal: 24,
  },

  graciasIcono: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  graciasTitulo: {
    fontSize: 24,
    fontWeight: "800",
  },

  graciasTexto: {
    marginBottom: 6,
    fontSize: 14,
  },

  pie: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },

  botonEnviar: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 999,
  },

  botonEnviarTexto: {
    fontSize: 16,
    fontWeight: "700",
  },

  omitir: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
});
