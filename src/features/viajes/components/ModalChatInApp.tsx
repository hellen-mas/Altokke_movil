import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import {
  useInAppComunicacion,
} from "@/features/viajes/hooks/useInAppComunicacion";
import { emitirNotificacionPush } from "@/features/notificaciones/services/notificacionesService";

export interface ModalChatInAppProps {
  visible: boolean;
  onCerrar: () => void;
  viajeId: string | null;
  usuarioActualId: string | null;
  rolUsuario: "conductor" | "pasajero";
}

export function ModalChatInApp({
  visible,
  onCerrar,
  viajeId,
  usuarioActualId,
  rolUsuario,
}: ModalChatInAppProps) {
  const { colores } = useAltokkeTheme();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const {
    mensajes,
    cargando,
    quickRepliesDisponibles,
    enviarTexto,
    enviarQuickReply,
    marcarComoLeidos,
  } = useInAppComunicacion({
    viajeId,
    usuarioActualId,
    rolUsuario,
  });

  useEffect(() => {
    if (visible) {
      marcarComoLeidos();
    }
  }, [visible, marcarComoLeidos]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    const contenido = texto.trim();
    setTexto("");
    setEnviando(true);
    try {
      await enviarTexto(contenido);
      if (viajeId) {
        void emitirNotificacionPush({
          evento: "chat_mensaje",
          viajeId,
          mensaje: contenido,
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleQuickReply = async (item: (typeof quickRepliesDisponibles)[number]) => {
    if (enviando) return;
    setEnviando(true);
    try {
      await enviarQuickReply(item);
      if (viajeId) {
        void emitirNotificacionPush({
          evento: "chat_mensaje",
          viajeId,
          mensaje: item.texto,
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onCerrar}
    >
      <KeyboardAvoidingView
        style={[
          styles.contenedor,
          { backgroundColor: colores.fondo, paddingTop: insets.top },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Cabecera */}
        <View
          style={[
            styles.cabecera,
            {
              backgroundColor: colores.superficie,
              borderBottomColor: colores.linea,
            },
          ]}
        >
          <View style={styles.cabeceraInfo}>
            <Text style={[styles.cabeceraTitulo, { color: colores.texto }]}>
              Chat del viaje
            </Text>
            <Text style={[styles.cabeceraSubtitulo, { color: colores.secundario }]}>
              {rolUsuario === "pasajero" ? "Conductor" : "Pasajero"} • Altokke Seguro
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.botonCerrar, pressed && { opacity: 0.7 }]}
            onPress={onCerrar}
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={colores.texto} />
          </Pressable>
        </View>

        {/* Lista de mensajes */}
        {cargando && mensajes.length === 0 ? (
          <View style={styles.centro}>
            <ActivityIndicator size="small" color={colores.primario} />
            <Text style={[styles.textoVacio, { color: colores.secundario }]}>
              Cargando mensajes...
            </Text>
          </View>
        ) : mensajes.length === 0 ? (
          <View style={styles.centro}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colores.secundario}
            />
            <Text style={[styles.textoVacio, { color: colores.secundario }]}>
              Comunícate de forma segura sin compartir tu número privado.
            </Text>
          </View>
        ) : (
          <FlatList
            data={mensajes}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listaMensajes}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const esMio = item.remitente_id === usuarioActualId;
              const hora = new Date(item.creado_en).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <View
                  style={[
                    styles.burbujaContenedor,
                    esMio ? styles.burbujaMiaContenedor : styles.burbujaOtroContenedor,
                  ]}
                >
                  <View
                    style={[
                      styles.burbuja,
                      esMio
                        ? [styles.burbujaMia, { backgroundColor: colores.primario }]
                        : [
                            styles.burbujaOtro,
                            {
                              backgroundColor: colores.superficie,
                              borderColor: colores.linea,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.mensajeTexto,
                        { color: esMio ? "#FFFFFF" : colores.texto },
                      ]}
                    >
                      {item.contenido}
                    </Text>
                    <Text
                      style={[
                        styles.mensajeHora,
                        { color: esMio ? "rgba(255,255,255,0.7)" : colores.secundario },
                      ]}
                    >
                      {hora}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Respuestas rápidas */}
        <View style={styles.zonaQuickReplies}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickRepliesDisponibles}
            keyExtractor={(q) => q.id}
            contentContainerStyle={styles.quickRepliesList}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.pillQuickReply,
                  {
                    backgroundColor: colores.campo,
                    borderColor: colores.linea,
                  },
                ]}
                onPress={() => handleQuickReply(item)}
                disabled={enviando}
              >
                <Text style={[styles.pillTexto, { color: colores.texto }]}>
                  {item.texto}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {/* Input para escribir */}
        <View
          style={[
            styles.barraInput,
            {
              backgroundColor: colores.superficie,
              borderTopColor: colores.linea,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colores.campo,
                color: colores.texto,
                borderColor: colores.linea,
              },
            ]}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colores.secundario}
            value={texto}
            onChangeText={setTexto}
            returnKeyType="send"
            onSubmitEditing={handleEnviar}
            multiline={false}
          />

          <Pressable
            style={[
              styles.botonEnviar,
              { backgroundColor: colores.primario },
              (!texto.trim() || enviando) && { opacity: 0.5 },
            ]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
          >
            {enviando ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  cabeceraInfo: {
    flex: 1,
  },
  cabeceraTitulo: {
    fontSize: 17,
    fontWeight: "800",
  },
  cabeceraSubtitulo: {
    fontSize: 12,
    marginTop: 2,
  },
  botonCerrar: {
    padding: 6,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  textoVacio: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  listaMensajes: {
    padding: 16,
    gap: 10,
  },
  burbujaContenedor: {
    flexDirection: "row",
    marginBottom: 8,
  },
  burbujaMiaContenedor: {
    justifyContent: "flex-end",
  },
  burbujaOtroContenedor: {
    justifyContent: "flex-start",
  },
  burbuja: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  burbujaMia: {
    borderBottomRightRadius: 4,
  },
  burbujaOtro: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  mensajeTexto: {
    fontSize: 14,
    lineHeight: 20,
  },
  mensajeHora: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  zonaQuickReplies: {
    paddingVertical: 8,
  },
  quickRepliesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pillQuickReply: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillTexto: {
    fontSize: 12,
    fontWeight: "600",
  },
  barraInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
  },
  botonEnviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
