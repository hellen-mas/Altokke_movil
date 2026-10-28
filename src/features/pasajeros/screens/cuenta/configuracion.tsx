import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { 
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { authService } from "@/features/autenticacion/services/authService";
import type { ModoApariencia } from "@/shared/theme/temaStore";
import { useEffect } from "react";

type ClavePreferencia = "idioma" | "tema" | "unidades" | "mapaEstilo";
type ClaveModal = "idioma" | "tema" | "unidades" | "mapa";

type OpcionConfig = {
  titulo: string;
  etiqueta: string;
  campo: ClavePreferencia;
  icono: keyof typeof Ionicons.glyphMap;
  opciones: string[];
};

const CONFIGURACIONES: Record<ClaveModal, OpcionConfig> = {
  idioma: {
    titulo: "Seleccionar idioma",
    etiqueta: "Idioma",
    campo: "idioma",
    icono: "globe-outline",
    opciones: ["Español (Perú)", "Quechua", "English"],
  },
  tema: {
    titulo: "Apariencia de la app",
    etiqueta: "Apariencia",
    campo: "tema",
    icono: "moon-outline",
    opciones: ["Automático (Sistema)", "Claro", "Oscuro"],
  },
  unidades: {
    titulo: "Unidades de distancia",
    etiqueta: "Distancia",
    campo: "unidades",
    icono: "speedometer-outline",
    opciones: ["Kilómetros (km)", "Millas (mi)"],
  },
  mapa: {
    titulo: "Estilo del mapa",
    etiqueta: "Estilo del mapa",
    campo: "mapaEstilo",
    icono: "map-outline",
    opciones: ["Estándar", "Satélite", "Híbrido"],
  },
};

const CLAVES: ClaveModal[] = [
  "idioma",
  "tema",
  "unidades",
  "mapa",
];


const ETIQUETAS_TEMA: Record<ModoApariencia, string> = {
  automatico: "Automático (Sistema)",
  claro: "Claro",
  oscuro: "Oscuro",
};

function obtenerModoTema(valor: string): ModoApariencia {
  switch (valor) {
    case "Claro":
    case "claro":
      return "claro";

    case "Oscuro":
    case "oscuro":
      return "oscuro";

    default:
      return "automatico";
  }
}

export default function Configuracion() {
  const {
    colores,
    modoPreferido,
    setModoPreferido,
  } = useAltokkeTheme();
  const { userId } = useAuth();
  const { perfil, guardarPreferencias } = usePerfilPasajero();

  const temaGuardado = perfil?.preferencias?.tema;

  useEffect(() => {
    if (
      temaGuardado === "automatico" ||
      temaGuardado === "claro" ||
      temaGuardado === "oscuro"
    ) {
      setModoPreferido(temaGuardado);
    }
  }, [temaGuardado, setModoPreferido]);

  const [modalClave, setModalClave] = useState<ClaveModal | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);

  const prefs = perfil?.preferencias || {};
  const configActual = modalClave ? CONFIGURACIONES[modalClave] : null;

  const cerrarModal = () => {
    if (!guardando) setModalClave(null);
  };

  const seleccionarOpcion = async (
    campo: ClavePreferencia,
    valor: string
  ) => {
    if (guardando) return;

    if (!userId) {
      Alert.alert(
        "Sesión requerida",
        "Inicia sesión para guardar tus preferencias."
      );
      return;
    }

    const esCambioTema = campo === "tema";
    const modoAnterior = modoPreferido;

    const nuevoModo = esCambioTema
      ? obtenerModoTema(valor)
      : null;

    try {
      setGuardando(true);

      // Aplicar el tema inmediatamente.
      if (nuevoModo) {
        setModoPreferido(nuevoModo);
      }

      // Guardar la preferencia real en Supabase.
      if (esCambioTema && nuevoModo) {
        await guardarPreferencias({
          tema: nuevoModo,
        });
      } else {
        await guardarPreferencias({
          [campo]: valor,
        });
      }

      setModalClave(null);
    } catch (error) {
      // Restaurar el tema anterior si falla el guardado.
      if (nuevoModo) {
        setModoPreferido(modoAnterior);
      }

      Alert.alert(
        "No se pudo guardar",
        "Comprueba tu conexión e inténtalo nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarCuenta = () => {
    if (eliminandoCuenta) return;

    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que deseas eliminar tu cuenta de Altokke? Perderás el acceso a ella. Algunos registros históricos podrán conservarse por motivos legales y operativos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar cuenta",
          style: "destructive",
          onPress: async () => {
            try {
              setEliminandoCuenta(true);
              await authService.eliminarMiCuenta();
              router.replace("/(auth)/bienvenida");
            } catch (error: unknown) {
              Alert.alert(
                "No se pudo eliminar la cuenta",
                error instanceof Error
                  ? error.message
                  : "Inténtalo nuevamente."
              );
            } finally {
              setEliminandoCuenta(false);
            }
          },
        },
      ]
    );
  };

  const mostrarPrivacidad = () => {
    Alert.alert(
      "Privacidad y derechos ARCO",
      "Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos personales. Contacta al equipo de soporte de Altokke para recibir orientación."
    );
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Configuración" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        <Text
          style={[
            styles.descripcion,
            { color: colores.secundario },
          ]}
        >
          Personaliza tu experiencia en Altokke.
        </Text>

        {/* Preferencias */}
        <View style={styles.grupo}>
          <Text
            style={[
              styles.tituloGrupo,
              { color: colores.secundario },
            ]}
          >
            PREFERENCIAS
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
            {CLAVES.map((clave, index) => {
              const config = CONFIGURACIONES[clave];
              const valor =
                clave === "tema"
                  ? ETIQUETAS_TEMA[modoPreferido]
                  : prefs?.[config.campo] || config.opciones[0];

              return (
                <View key={clave}>
                  <Pressable
                    onPress={() => setModalClave(clave)}
                    accessibilityRole="button"
                    accessibilityLabel={config.etiqueta}
                    style={({ pressed }) => [
                      styles.fila,
                      pressed && {
                        backgroundColor: colores.campo,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconoCaja,
                        { backgroundColor: colores.exitoFondo },
                      ]}
                    >
                      <Ionicons
                        name={config.icono}
                        size={19}
                        color={colores.exitoTexto}
                      />
                    </View>

                    <View style={styles.textos}>
                      <Text
                        style={[
                          styles.filaTitulo,
                          { color: colores.texto },
                        ]}
                      >
                        {config.etiqueta}
                      </Text>

                      <Text
                        style={[
                          styles.filaSubtitulo,
                          { color: colores.secundario },
                        ]}
                      >
                        {valor}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colores.secundario}
                    />
                  </Pressable>

                  {index !== CLAVES.length - 1 && (
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
        </View>

        {/* Privacidad */}
        <View style={styles.grupo}>
          <Text
            style={[
              styles.tituloGrupo,
              { color: colores.secundario },
            ]}
          >
            PRIVACIDAD Y CUENTA
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
              onPress={mostrarPrivacidad}
              accessibilityRole="button"
              accessibilityLabel="Privacidad y datos"
              style={({ pressed }) => [
                styles.fila,
                pressed && {
                  backgroundColor: colores.campo,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colores.exitoTexto}
              />

              <View style={styles.textos}>
                <Text
                  style={[
                    styles.filaTitulo,
                    { color: colores.texto },
                  ]}
                >
                  Privacidad y datos
                </Text>

                <Text
                  style={[
                    styles.filaSubtitulo,
                    { color: colores.secundario },
                  ]}
                >
                  Conoce tus derechos
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
              onPress={confirmarEliminarCuenta}
              disabled={eliminandoCuenta}
              accessibilityRole="button"
              accessibilityLabel="Eliminar cuenta"
              style={({ pressed }) => [
                styles.fila,
                pressed && {
                  backgroundColor: colores.campo,
                },
                eliminandoCuenta && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={colores.error}
              />

              <View style={styles.textos}>
                <Text
                  style={[
                    styles.filaTitulo,
                    { color: colores.error },
                  ]}
                >
                  Eliminar cuenta
                </Text>

                <Text
                  style={[
                    styles.filaSubtitulo,
                    { color: colores.secundario },
                  ]}
                >
                  {eliminandoCuenta
                    ? "Procesando solicitud..."
                    : "Solicitar eliminación"}
                </Text>
              </View>

              {eliminandoCuenta ? (
                <ActivityIndicator
                  size="small"
                  color={colores.error}
                />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colores.secundario}
                />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal 
        visible={modalClave !== null}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalFondo}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={cerrarModal}
            accessibilityLabel="Cerrar selector"
          />

          <View
            style={[
              styles.modalCaja,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.linea,
              },
            ]}
          >
            {configActual && (
              <>
                <View style={styles.modalEncabezado}>
                  <Text
                    style={[
                      styles.modalTitulo,
                      { color: colores.texto },
                    ]}
                  >
                    {configActual.titulo}
                  </Text>

                  <Pressable
                    onPress={cerrarModal}
                    disabled={guardando}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar"
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={colores.secundario}
                    />
                  </Pressable>
                </View>

                {configActual.opciones.map((opcion, index) => {
                  const seleccionado =
                    configActual.campo === "tema"
                      ? modoPreferido === obtenerModoTema(opcion)
                      : (prefs?.[configActual.campo] ||
                          configActual.opciones[0]) === opcion;

                  return (
                    <View key={opcion}>
                      <Pressable
                        onPress={() =>
                          void seleccionarOpcion(
                            configActual.campo,
                            opcion
                          )
                        }
                        disabled={guardando}
                        style={({ pressed }) => [
                          styles.modalOpcion,
                          pressed && {
                            backgroundColor: colores.campo,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalTexto,
                            {
                              color: seleccionado
                                ? colores.exitoTexto
                                : colores.texto,
                            },
                          ]}
                        >
                          {opcion}
                        </Text>

                        {seleccionado && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={colores.exitoTexto}
                          />
                        )}
                      </Pressable>

                      {index !==
                        configActual.opciones.length - 1 && (
                        <View
                          style={[
                            styles.separador,
                            {
                              marginLeft: 0,
                              backgroundColor: colores.linea,
                            },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}

                {guardando && (
                  <ActivityIndicator
                    style={{ marginTop: 12 }}
                    color={colores.exitoTexto}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
    gap: 24,
  },

  descripcion: {
    fontSize: 14,
    lineHeight: 20,
  },

  grupo: {
    gap: 10,
  },

  tituloGrupo: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 2,
  },

  tarjeta: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },

  fila: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  iconoCaja: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textos: {
    flex: 1,
    gap: 3,
  },

  filaTitulo: {
    fontSize: 14,
    fontWeight: "600",
  },

  filaSubtitulo: {
    fontSize: 12,
  },

  separador: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
    marginRight: 16,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  modalCaja: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 4,
  },

  modalEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },

  modalTitulo: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
  },

  modalOpcion: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  modalTexto: {
    fontSize: 15,
    fontWeight: "500",
  },
});
