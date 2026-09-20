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
import { CabeceraPasajero } from "@/components/pasajero/CabeceraPasajero";
import { TarjetaConductor } from "@/components/pasajero/TarjetaConductor";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { ORIGEN_EJEMPLO } from "@/constants/pasajero";
import { useViaje } from "@/context/ViajeContext";
import { useResumenViaje } from "@/hooks/use-resumen-viaje";
import { paletaColores } from "@/paletaColores";
import {
  formatearHora,
  formatearSoles,
  NOMBRE_METODO_PAGO,
} from "@/utils/viaje";

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
  onCambiar,
}: {
  valor: number;
  tamano: number;
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
            color={numero <= valor ? COLOR_ESTRELLA : paletaColores.deshabilitado}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function PantallaCalificacion() {
  const { setDestino, registrarViaje } = useViaje();
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

  const { destino, tarifa, metodoPago } = resumen;

  const alternarEtiqueta = (id: string) => {
    setEtiquetas((actuales) =>
      actuales.includes(id)
        ? actuales.filter((etiqueta) => etiqueta !== id)
        : [...actuales, id],
    );
  };

  const guardarViaje = (calificacion?: number) => {
    registrarViaje({
      origen: ORIGEN_EJEMPLO.nombre,
      destino: destino.nombre,
      lugarDestino: destino,
      tarifa,
      estado: "completado",
      calificacion,
    });
  };

  const irAlInicio = () => {
    router.replace("/mapa");
    setDestino(null);
  };

  const enviarCalificacion = () => {
    guardarViaje(estrellas);
    setEnviado(true);
  };

  const omitir = () => {
    guardarViaje();
    irAlInicio();
  };

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <CabeceraPasajero
          titulo="Califica tu viaje"
          subtitulo="Llegaste a tu destino"
          paddingInferior={48}
        />

        {/* Viaje finalizado */}
        <View style={styles.finalizado}>
          <Ionicons
            name="checkmark-circle"
            size={34}
            color={paletaColores.boton}
          />
          <View style={styles.finalizadoTextos}>
            <Text style={styles.finalizadoTitulo}>Viaje finalizado</Text>
            <Text style={styles.detalle}>Gracias por viajar con Altokke</Text>
          </View>
          <View style={styles.finalizadoFecha}>
            <Text style={styles.insignia}>Completado</Text>
            <Text style={styles.detalle}>Hoy, {formatearHora(fecha)}</Text>
          </View>
        </View>

        {enviado ? (
          <View style={styles.gracias}>
            <View style={styles.graciasIcono}>
              <Ionicons name="heart" size={40} color={paletaColores.boton} />
            </View>
            <Text style={styles.graciasTitulo}>¡Gracias por calificar!</Text>
            <Text style={styles.graciasTexto}>
              Tu opinión ayuda a mejorar Altokke.
            </Text>
            <Estrellas valor={estrellas} tamano={30} />
          </View>
        ) : (
          <>
            {/* Resumen del viaje */}
            <Text style={styles.seccion}>Resumen del viaje</Text>
            <View style={styles.tarjetaResumen}>
              <View style={styles.recorrido}>
                <View style={styles.filaLugar}>
                  <Ionicons
                    name="radio-button-on"
                    size={18}
                    color={paletaColores.boton}
                  />
                  <Text style={styles.lugar} numberOfLines={1}>
                    {ORIGEN_EJEMPLO.nombre}
                  </Text>
                </View>
                <View style={styles.filaLugar}>
                  <Ionicons
                    name="location-sharp"
                    size={18}
                    color={paletaColores.error}
                  />
                  <Text style={styles.lugar} numberOfLines={1}>
                    {destino.nombre}
                  </Text>
                </View>
              </View>

              <View style={styles.tarifaFinal}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={paletaColores.boton}
                />
                <Text style={styles.tarifaValor}>{formatearSoles(tarifa)}</Text>
                <Text style={styles.detalle}>
                  {metodoPago === "efectivo"
                    ? "Pago en efectivo"
                    : `Pago con ${NOMBRE_METODO_PAGO[metodoPago]}`}
                </Text>
              </View>
            </View>

            <Text style={styles.seccion}>Tu conductor</Text>
            <TarjetaConductor />

            {/* Calificación */}
            <Text style={styles.pregunta}>¿Cómo fue tu viaje?</Text>
            <Text style={styles.detalle}>Tu opinión ayuda a mejorar Altokke</Text>

            <View style={styles.calificar}>
              <Estrellas valor={estrellas} tamano={40} onCambiar={setEstrellas} />
              <Text style={styles.textoCalificacion}>
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
                    style={[styles.etiqueta, activa && styles.etiquetaActiva]}
                  >
                    <Ionicons
                      name={etiqueta.icono}
                      size={16}
                      color={
                        activa
                          ? paletaColores.superficieClara
                          : paletaColores.boton
                      }
                    />
                    <Text
                      style={[
                        styles.etiquetaTexto,
                        activa && styles.etiquetaTextoActiva,
                      ]}
                    >
                      {etiqueta.texto}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Comentario */}
            <Text style={styles.seccion}>Deja un comentario (opcional)</Text>
            <View style={styles.comentario}>
              <TextInput
                value={comentario}
                onChangeText={setComentario}
                placeholder="Cuéntanos cómo fue tu viaje..."
                placeholderTextColor={paletaColores.textoSecundarioClaro}
                multiline
                maxLength={MAX_COMENTARIO}
                style={styles.comentarioInput}
              />
              <Text style={styles.contador}>
                {comentario.length}/{MAX_COMENTARIO}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[styles.pie, { paddingBottom: Math.max(insets.bottom, 14) }]}
      >
        {enviado ? (
          <PrimaryButton title="Volver al inicio" onPress={irAlInicio} />
        ) : (
          <>
            <Pressable
              onPress={enviarCalificacion}
              disabled={estrellas === 0}
              style={({ pressed }) => [
                styles.botonEnviar,
                estrellas === 0 && styles.botonEnviarDeshabilitado,
                pressed && styles.botonEnviarPresionado,
              ]}
            >
              <Ionicons
                name="paper-plane"
                size={20}
                color={paletaColores.textoOscuro}
              />
              <Text style={styles.botonEnviarTexto}>Enviar calificación</Text>
            </Pressable>

            <Pressable onPress={omitir} hitSlop={8}>
              <Text style={styles.omitir}>Omitir</Text>
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
    backgroundColor: paletaColores.fondoClaro,
  },

  contenido: {
    paddingBottom: 20,
  },

  finalizado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -34,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  finalizadoTextos: {
    flex: 1,
  },

  finalizadoTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  finalizadoFecha: {
    alignItems: "flex-end",
    gap: 2,
  },

  insignia: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    color: paletaColores.botonPresionado,
    backgroundColor: "#E5F8EF",
  },

  detalle: {
    fontSize: 12,
    color: paletaColores.textoSecundarioClaro,
  },

  seccion: {
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  tarjetaResumen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  recorrido: {
    flex: 1,
    gap: 10,
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
    color: paletaColores.textoClaro,
  },

  tarifaFinal: {
    alignItems: "center",
    gap: 2,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: paletaColores.bordeClaro,
  },

  tarifaValor: {
    fontSize: 20,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  pregunta: {
    marginTop: 20,
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  calificar: {
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },

  estrellas: {
    flexDirection: "row",
    gap: 8,
  },

  textoCalificacion: {
    fontSize: 14,
    fontWeight: "700",
    color: paletaColores.textoSecundarioClaro,
  },

  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    marginHorizontal: 16,
  },

  etiqueta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF8F1",
    borderWidth: 1,
    borderColor: "#CFEEDD",
  },

  etiquetaActiva: {
    backgroundColor: paletaColores.boton,
    borderColor: paletaColores.boton,
  },

  etiquetaTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: paletaColores.textoClaro,
  },

  etiquetaTextoActiva: {
    color: paletaColores.textoOscuro,
  },

  comentario: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: paletaColores.superficieClara,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
  },

  comentarioInput: {
    minHeight: 64,
    fontSize: 14,
    textAlignVertical: "top",
    color: paletaColores.textoClaro,
  },

  contador: {
    alignSelf: "flex-end",
    fontSize: 11,
    color: paletaColores.textoSecundarioClaro,
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
    backgroundColor: "#E5F8EF",
  },

  graciasTitulo: {
    fontSize: 24,
    fontWeight: "800",
    color: paletaColores.textoClaro,
  },

  graciasTexto: {
    marginBottom: 6,
    fontSize: 14,
    color: paletaColores.textoSecundarioClaro,
  },

  pie: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },

  botonEnviar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    backgroundColor: paletaColores.boton,
  },

  botonEnviarPresionado: {
    backgroundColor: paletaColores.botonPresionado,
  },

  botonEnviarDeshabilitado: {
    backgroundColor: "#C9D3CE",
  },

  botonEnviarTexto: {
    fontSize: 18,
    fontWeight: "700",
    color: paletaColores.textoOscuro,
  },

  omitir: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: paletaColores.textoSecundarioClaro,
  },
});
