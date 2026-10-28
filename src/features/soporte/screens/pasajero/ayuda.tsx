import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { ItemMenu } from "@/features/pasajeros/components/ItemMenu";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

interface TemaAyuda {
  id: string;
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  preguntas: PreguntaFrecuente[];
}

const TEMAS_AYUDA: TemaAyuda[] = [
  {
    id: "viaje",
    icono: "car-outline",
    titulo: "Problemas con un viaje",
    descripcion: "Objetos olvidados, cobros indebidos o rutas",
    preguntas: [
      {
        pregunta: "¿Cómo reportar un objeto olvidado?",
        respuesta:
          "Si olvidaste una pertenencia en el mototaxi, contáctanos de inmediato mediante el botón 'Contactar soporte' indicando la hora aproximada y el destino del viaje para comunicarnos con el conductor.",
      },
      {
        pregunta: "¿Qué hago si el conductor no llegó?",
        respuesta:
          "Si pasaron más de 5 minutos y el mototaxi no se mueve hacia tu punto de recogida, puedes cancelar el viaje sin penalización y solicitar una nueva unidad.",
      },
      {
        pregunta: "¿La tarifa puede cambiar durante el viaje?",
        respuesta:
          "No. En Altokke la tarifa acordada al confirmar el viaje es fija en el ámbito urbano de Bagua, salvo que solicites un cambio de destino durante el trayecto.",
      },
    ],
  },
  {
    id: "pagos",
    icono: "card-outline",
    titulo: "Métodos de pago",
    descripcion: "Efectivo, Yape y Plin en Bagua",
    preguntas: [
      {
        pregunta: "¿Cómo pagar con Yape o Plin?",
        respuesta:
          "Al finalizar tu viaje, pídele el número o código QR de Yape/Plin al conductor. Muestra tu constancia de pago antes de descender del vehículo.",
      },
      {
        pregunta: "¿Puedo cambiar de método de pago durante el viaje?",
        respuesta:
          "Sí, puedes coordinar directamente con el conductor si prefieres cambiar de efectivo a Yape/Plin o viceversa.",
      },
    ],
  },
  {
    id: "cuenta",
    icono: "shield-checkmark-outline",
    titulo: "Cuenta y seguridad",
    descripcion: "Protección de datos y verificación",
    preguntas: [
      {
        pregunta: "¿Cómo actualizo mi número de teléfono?",
        respuesta:
          "Ve a la sección 'Cuenta' > 'Información personal' y toca tu número de teléfono para actualizarlo con tu nuevo número activo.",
      },
      {
        pregunta: "¿Mis viajes están asegurados?",
        respuesta:
          "Todos nuestros conductores cuentan con verificación de identidad (DNI), SOAT vigente e historial verificado para garantizar tu tranquilidad.",
      },
    ],
  },
  {
    id: "promociones",
    icono: "pricetag-outline",
    titulo: "Promociones y descuentos",
    descripcion: "Cupones y beneficios por fidelidad",
    preguntas: [
      {
        pregunta: "¿Cómo obtengo descuentos en mis viajes?",
        respuesta:
          "Recibirás códigos promocionales y beneficios a través de notificaciones en la app por tus primeros viajes y fechas festivas en Bagua.",
      },
    ],
  },
  {
    id: "otros",
    icono: "ellipsis-horizontal",
    titulo: "Más temas y normas",
    descripcion: "Términos, horarios y cobertura en Amazonas",
    preguntas: [
      {
        pregunta: "¿Cuál es el horario de atención?",
        respuesta:
          "Altokke opera en Bagua todos los días de 5:30 AM a 11:00 PM con cobertura completa en zonas urbanas y periféricas.",
      },
    ],
  },
];

export default function Ayuda() {
  const { colores } = useAltokkeTheme();
  const [busqueda, setBusqueda] = useState("");
  const [temaSeleccionado, setTemaSeleccionado] = useState<TemaAyuda | null>(null);

  const temasFiltrados = TEMAS_AYUDA.filter((tema) => {
    const texto = `${tema.titulo} ${tema.descripcion} ${tema.preguntas.map((p) => p.pregunta).join(" ")}`.toLowerCase();
    return texto.includes(busqueda.trim().toLowerCase());
  });

  const contactarWhatsApp = () => {
    const mensaje = encodeURIComponent(
      "Hola equipo Altokke, necesito asistencia con un viaje o mi cuenta de pasajero."
    );
    const url = `https://wa.me/51913714910?text=${mensaje}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Soporte Altokke", "Comunícate directamente a nuestra central: +51 913 714 910.");
        }
      })
      .catch(() => {
        Alert.alert("Soporte Altokke", "Llama a nuestra central: +51 913 714 910.");
      });
  };

  const contactarSoporte = () => {
    Alert.alert("Canales de Soporte", "¿Cómo prefieres comunicarte con nuestro equipo?", [
      {
        text: "WhatsApp Soporte (Inmediato)",
        onPress: contactarWhatsApp,
      },
      {
        text: "Llamada Telefónica",
        onPress: () => Linking.openURL("tel:+51913714910").catch(() => {}),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Ayuda y Soporte" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contenido}
      >
        <View
          style={[
            styles.buscador,
            {
              backgroundColor: colores.campo,
              borderColor: colores.linea,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colores.secundario}
          />
          <TextInput
            style={[styles.inputBusqueda, { color: colores.textoCampo }]}
            placeholder="Buscar preguntas o temas..."
            placeholderTextColor={colores.secundario}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCorrect={false}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colores.secundario} />
            </Pressable>
          )}
        </View>

        <Text style={[styles.seccion, { color: colores.texto }]}>
          Temas frecuentes
        </Text>

        {temasFiltrados.length === 0 ? (
          <Text style={[styles.sinResultados, { color: colores.secundario }]}>
            No encontramos temas con esa búsqueda. Prueba con otras palabras o contacta a soporte.
          </Text>
        ) : (
          temasFiltrados.map((tema) => (
            <ItemMenu
              key={tema.id}
              icono={tema.icono}
              titulo={tema.titulo}
              subtitulo={tema.descripcion}
              onPress={() => setTemaSeleccionado(tema)}
            />
          ))
        )}

        {/* Tarjeta de soporte */}
        <Pressable
          style={({ pressed }) => [
            styles.soporte,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.linea,
            },
            pressed && { opacity: 0.8 },
          ]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Contactar soporte"
          onPress={contactarSoporte}
        >
          <Ionicons
            name="headset-outline"
            size={24}
            color={colores.exitoTexto}
          />
          <View style={styles.soporteTextos}>
            <Text style={[styles.soporteTitulo, { color: colores.texto }]}>
              Contactar soporte 24/7
            </Text>
            <Text style={[styles.soporteSubtitulo, { color: colores.secundario }]}>
              Atención vía WhatsApp y llamada en Bagua
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colores.secundario}
          />
        </Pressable>
      </ScrollView>

      {/* Modal Detalle de Tema */}
      <Modal
        visible={Boolean(temaSeleccionado)}
        transparent
        animationType="fade"
        onRequestClose={() => setTemaSeleccionado(null)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            <View style={styles.cabeceraModal}>
              <Text style={[styles.modalTitulo, { color: colores.texto }]}>
                {temaSeleccionado?.titulo}
              </Text>
              <Pressable onPress={() => setTemaSeleccionado(null)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colores.secundario} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {temaSeleccionado?.preguntas.map((p, idx) => (
                <View key={idx} style={[styles.preguntaBloque, { borderBottomColor: colores.linea }]}>
                  <Text style={[styles.preguntaTexto, { color: colores.texto }]}>{p.pregunta}</Text>
                  <Text style={[styles.respuestaTexto, { color: colores.secundario }]}>{p.respuesta}</Text>
                </View>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.botonCerrarModal, { backgroundColor: colores.primario }]}
              onPress={() => setTemaSeleccionado(null)}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },

  inputBusqueda: {
    flex: 1,
    fontSize: 15,
  },

  seccion: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  sinResultados: {
    paddingVertical: 20,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  soporte: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
  },

  soporteTextos: {
    flex: 1,
    gap: 3,
  },

  soporteTitulo: {
    fontSize: 15,
    fontWeight: "700",
  },

  soporteSubtitulo: {
    fontSize: 12,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalCaja: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 14,
  },

  cabeceraModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },

  preguntaBloque: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },

  preguntaTexto: {
    fontSize: 15,
    fontWeight: "700",
  },

  respuestaTexto: {
    fontSize: 13,
    lineHeight: 19,
  },

  botonCerrarModal: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
});
