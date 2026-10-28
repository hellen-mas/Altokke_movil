
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useViaje } from "@/features/viajes/context/ViajeContext";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { TituloAltokke } from "@/shared/components/ui/TituloAltokke";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  formatearFechaHora,
  formatearSoles,
} from "@/features/viajes/utils/viaje";

const MOTIVOS = [
  {
    id: "objeto",
    titulo: "Olvidé un objeto",
    icono: "bag-handle-outline",
  },
  {
    id: "tarifa",
    titulo: "Problema con la tarifa",
    icono: "cash-outline",
  },
  {
    id: "conductor",
    titulo: "Problema con el conductor",
    icono: "person-outline",
  },
  {
    id: "seguridad",
    titulo: "Incidente de seguridad",
    icono: "shield-outline",
  },
  {
    id: "otro",
    titulo: "Otro problema",
    icono: "ellipsis-horizontal",
  },
] as const;

type Motivo = (typeof MOTIVOS)[number]["id"];

export default function ReportarViaje() {
  const { viajeId } =
    useLocalSearchParams<{ viajeId: string }>();

  const { colores } = useAltokkeTheme();
  const { historial } = useViaje();

  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const viaje = historial.find((v) => v.id === viajeId);
  const motivoSeleccionado = MOTIVOS.find(
    (item) => item.id === motivo
  );

  const enviarReporte = () => {
    if (!viaje || enviando) return;

    if (!motivo) {
      Alert.alert(
        "Selecciona un motivo",
        "Indica qué problema ocurrió durante tu viaje."
      );
      return;
    }

    if (descripcion.trim().length < 10) {
      Alert.alert(
        "Describe lo ocurrido",
        "Escribe al menos 10 caracteres para explicar el problema."
      );
      return;
    }

    const mensaje = [
      "Hola, equipo Altokke. Necesito reportar un problema.",
      "",
      `Motivo: ${motivoSeleccionado?.titulo}`,
      `Viaje: ${viaje.id}`,
      `Fecha: ${formatearFechaHora(viaje.fecha)}`,
      `Origen: ${viaje.origen}`,
      `Destino: ${viaje.destino}`,
      `Tarifa: ${formatearSoles(viaje.tarifa)}`,
      `Estado: ${viaje.estado}`,
      "",
      "Descripción:",
      descripcion.trim(),
    ].join("\n");

    Alert.alert(
      "Continuar a WhatsApp",
      "Se abrirá WhatsApp con los datos del viaje y tu descripción. Podrás revisar el mensaje antes de enviarlo. Este paso no registra un caso en Altokke.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: async () => {
            try {
              setEnviando(true);
              const url =
                `https://wa.me/51913714910?text=${encodeURIComponent(mensaje)}`;

              await Linking.openURL(url);
            } catch {
              Alert.alert(
                "No se pudo abrir WhatsApp",
                "Verifica que puedas acceder a WhatsApp e inténtalo nuevamente."
              );
            } finally {
              setEnviando(false);
            }
          },
        },
      ]
    );
  };

  if (!viaje) {
    return (
      <View
        style={[
          styles.pantalla,
          { backgroundColor: colores.fondo },
        ]}
      >
        <EncabezadoPantalla titulo="Reportar problema" />

        <View style={styles.estadoVacio}>
          <Ionicons
            name="alert-circle-outline"
            size={38}
            color={colores.secundario}
          />

          <Text
            style={[
              styles.textoVacio,
              { color: colores.texto },
            ]}
          >
            No encontramos el viaje seleccionado.
          </Text>

          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colores.exitoTexto }}>
              Volver a Actividad
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.pantalla,
        { backgroundColor: colores.fondo },
      ]}
    >
      <EncabezadoPantalla titulo="Soporte de viaje" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contenido}
      >
        <TituloAltokke
          texto="Reportar problema"
          style={styles.tituloPrincipal}
        />

        <Text
          style={[
            styles.descripcionInicial,
            { color: colores.secundario },
          ]}
        >
          Cuéntanos qué ocurrió para que podamos
          orientarte con tu solicitud.
        </Text>

        {/* Viaje seleccionado */}
        <Text
          style={[
            styles.etiqueta,
            { color: colores.secundario },
          ]}
        >
          VIAJE SELECCIONADO
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
          <Text
            style={[
              styles.fecha,
              { color: colores.secundario },
            ]}
          >
            {formatearFechaHora(viaje.fecha)}
          </Text>

          <View style={styles.filaUbicacion}>
            <Ionicons
              name="radio-button-on"
              size={18}
              color={colores.exitoTexto}
            />

            <Text
              style={[styles.lugar, { color: colores.texto }]}
            >
              {viaje.origen}
            </Text>
          </View>

          <View style={styles.filaUbicacion}>
            <Ionicons
              name="location-outline"
              size={18}
              color={colores.secundario}
            />

            <Text
              style={[styles.lugar, { color: colores.texto }]}
            >
              {viaje.destino}
            </Text>
          </View>

          <View
            style={[
              styles.pieTarjeta,
              { borderTopColor: colores.linea },
            ]}
          >
            <Text style={{ color: colores.secundario }}>
              {viaje.estado === "completado"
                ? "Completado"
                : "Cancelado"}
            </Text>

            <Text
              style={[
                styles.tarifa,
                { color: colores.texto },
              ]}
            >
              {formatearSoles(viaje.tarifa)}
            </Text>
          </View>
        </View>

        {/* Motivo */}
        <Text
          style={[
            styles.etiqueta,
            { color: colores.secundario },
          ]}
        >
          ¿QUÉ PROBLEMA TUVISTE?
        </Text>

        <View
          style={[
            styles.tarjeta,
            styles.listaMotivos,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
          ]}
        >
          {MOTIVOS.map((item, index) => {
            const seleccionado = motivo === item.id;

            return (
              <View key={item.id}>
                <Pressable
                  onPress={() => setMotivo(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: seleccionado,
                  }}
                  style={({ pressed }) => [
                    styles.filaMotivo,
                    pressed && {
                      backgroundColor: colores.campo,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icono}
                    size={21}
                    color={colores.exitoTexto}
                  />

                  <Text
                    style={[
                      styles.nombreMotivo,
                      { color: colores.texto },
                    ]}
                  >
                    {item.titulo}
                  </Text>

                  <Ionicons
                    name={
                      seleccionado
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={21}
                    color={
                      seleccionado
                        ? colores.exitoTexto
                        : colores.secundario
                    }
                  />
                </Pressable>

                {index !== MOTIVOS.length - 1 && (
                  <View
                    style={[
                      styles.separador,
                      { backgroundColor: colores.linea },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Descripción */}
        <Text
          style={[
            styles.etiqueta,
            { color: colores.secundario },
          ]}
        >
          DESCRIBE LO OCURRIDO
        </Text>

        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Explica brevemente qué sucedió..."
          placeholderTextColor={colores.secundario}
          multiline
          maxLength={600}
          textAlignVertical="top"
          accessibilityLabel="Descripción del problema"
          style={[
            styles.campoDescripcion,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
              color: colores.texto,
            },
          ]}
        />

        <Text
          style={[
            styles.contador,
            { color: colores.secundario },
          ]}
        >
          {descripcion.length}/600
        </Text>

        <View
          style={[
            styles.aviso,
            { backgroundColor: colores.exitoFondo },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colores.exitoTexto}
          />

          <Text
            style={[
              styles.textoAviso,
              { color: colores.texto },
            ]}
          >
            El reporte se preparará para WhatsApp.
            No se guardará automáticamente como
            una incidencia en la aplicación.
          </Text>
        </View>

        <Pressable
          onPress={enviarReporte}
          disabled={enviando}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.botonEnviar,
            {
              backgroundColor: pressed
                ? colores.primarioPresionado
                : colores.primario,
              opacity: enviando ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons
            name="logo-whatsapp"
            size={21}
            color={colores.textoBoton}
          />

          <Text
            style={[
              styles.textoBoton,
              { color: colores.textoBoton },
            ]}
          >
            Continuar por WhatsApp
          </Text>
        </Pressable>

        <Text
          style={[
            styles.notaFinal,
            { color: colores.secundario },
          ]}
        >
          Si estás en peligro inmediato, busca un
          lugar seguro y comunícate con los servicios
          de emergencia.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 15,
  },
  tituloPrincipal: {
    fontSize: 27,
    lineHeight: 35,
  },
  descripcionInicial: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 6,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 7,
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 13,
  },
  fecha: {
    fontSize: 12,
    fontWeight: "600",
  },
  filaUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lugar: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  pieTarjeta: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tarifa: {
    fontSize: 16,
    fontWeight: "700",
  },
  listaMotivos: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
  },
  filaMotivo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 17,
    minHeight: 60,
  },
  nombreMotivo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
    marginRight: 16,
  },
  campoDescripcion: {
    borderWidth: 1,
    minHeight: 130,
    borderRadius: 16,
    padding: 15,
    fontSize: 14,
    lineHeight: 21,
  },
  contador: {
    fontSize: 11,
    textAlign: "right",
    marginTop: -8,
  },
  aviso: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 15,
  },
  textoAviso: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
  },
  botonEnviar: {
    minHeight: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 8,
  },
  textoBoton: {
    fontSize: 14,
    fontWeight: "700",
  },
  notaFinal: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
  },
  estadoVacio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  textoVacio: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
  },
});
