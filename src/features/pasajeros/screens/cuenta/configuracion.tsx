import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { ItemMenu } from "@/features/pasajeros/components/ItemMenu";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export default function Configuracion() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { perfil, guardarPreferencias } = usePerfilPasajero();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState<"idioma" | "tema" | "unidades" | "mapa" | "privacidad" | "datos" | null>(null);

  const idiomaActual = perfil?.preferencias?.idioma || "Español (Perú)";
  const temaActual = perfil?.preferencias?.tema || "Automático (Sistema)";
  const unidadesActual = perfil?.preferencias?.unidades || "Kilómetros (km)";
  const mapaActual = perfil?.preferencias?.mapaEstilo || "Estándar";
  const ahorroDatos = Boolean(perfil?.preferencias?.ahorroDatos);

  const abrirModal = (tipo: typeof modalTipo) => {
    setModalTipo(tipo);
    setModalVisible(true);
  };

  const seleccionarOpcion = async (campo: string, valor: any) => {
    try {
      if (userId) {
        await guardarPreferencias({ [campo]: valor });
      }
      setModalVisible(false);
      Alert.alert("Configuración guardada", "Tu preferencia ha sido actualizada.");
    } catch (err: any) {
      Alert.alert("Aviso", "No se pudo actualizar la configuración.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Configuración" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <ItemMenu
          icono="globe-outline"
          titulo="Idioma"
          subtitulo={idiomaActual}
          onPress={() => abrirModal("idioma")}
        />

        <ItemMenu
          icono="moon-outline"
          titulo="Tema"
          subtitulo={temaActual}
          onPress={() => abrirModal("tema")}
        />

        <ItemMenu
          icono="speedometer-outline"
          titulo="Unidades de distancia"
          subtitulo={unidadesActual}
          onPress={() => abrirModal("unidades")}
        />

        <ItemMenu
          icono="map-outline"
          titulo="Mapa"
          subtitulo={`Estilo ${mapaActual.toLowerCase()}`}
          onPress={() => abrirModal("mapa")}
        />

        <ItemMenu
          icono="lock-closed-outline"
          titulo="Privacidad y datos"
          subtitulo="Protección de datos personales (LPDP 29733)"
          onPress={() => abrirModal("privacidad")}
        />

        <ItemMenu
          icono="cellular-outline"
          titulo="Uso de datos móviles"
          subtitulo={ahorroDatos ? "Modo ahorro activo" : "Estándar (alta calidad)"}
          onPress={() => abrirModal("datos")}
        />
      </ScrollView>

      {/* Modal interactivo de opciones */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            {modalTipo === "idioma" && (
              <>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Seleccionar idioma</Text>
                {["Español (Perú)", "Quechua", "English"].map((op) => (
                  <Pressable
                    key={op}
                    style={[styles.opcionFila, { borderColor: colores.linea }]}
                    onPress={() => seleccionarOpcion("idioma", op)}
                  >
                    <Text style={[styles.opcionTexto, { color: colores.texto }]}>{op}</Text>
                    {idiomaActual === op && (
                      <Ionicons name="checkmark-circle" size={20} color={colores.exitoTexto} />
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {modalTipo === "tema" && (
              <>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Apariencia de la app</Text>
                {["Automático (Sistema)", "Claro", "Oscuro"].map((op) => (
                  <Pressable
                    key={op}
                    style={[styles.opcionFila, { borderColor: colores.linea }]}
                    onPress={() => seleccionarOpcion("tema", op)}
                  >
                    <Text style={[styles.opcionTexto, { color: colores.texto }]}>{op}</Text>
                    {temaActual === op && (
                      <Ionicons name="checkmark-circle" size={20} color={colores.exitoTexto} />
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {modalTipo === "unidades" && (
              <>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Unidades de distancia</Text>
                {["Kilómetros (km)", "Millas (mi)"].map((op) => (
                  <Pressable
                    key={op}
                    style={[styles.opcionFila, { borderColor: colores.linea }]}
                    onPress={() => seleccionarOpcion("unidades", op)}
                  >
                    <Text style={[styles.opcionTexto, { color: colores.texto }]}>{op}</Text>
                    {unidadesActual === op && (
                      <Ionicons name="checkmark-circle" size={20} color={colores.exitoTexto} />
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {modalTipo === "mapa" && (
              <>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Estilo del mapa</Text>
                {["Estándar", "Satélite", "Híbrido"].map((op) => (
                  <Pressable
                    key={op}
                    style={[styles.opcionFila, { borderColor: colores.linea }]}
                    onPress={() => seleccionarOpcion("mapaEstilo", op)}
                  >
                    <Text style={[styles.opcionTexto, { color: colores.texto }]}>{op}</Text>
                    {mapaActual === op && (
                      <Ionicons name="checkmark-circle" size={20} color={colores.exitoTexto} />
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {modalTipo === "privacidad" && (
              <>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Privacidad y Derechos ARCO</Text>
                <Text style={[styles.textoDescripcion, { color: colores.secundario }]}>
                  Tus datos están protegidos conforme a la Ley N° 29733 de Protección de Datos Personales en el Perú. Puedes solicitar la rectificación, acceso o supresión de tu información en cualquier momento contactando a soporte.
                </Text>
                <Pressable
                  style={[styles.botonAccion, { backgroundColor: colores.primario }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Aceptar</Text>
                </Pressable>
              </>
            )}

            {modalTipo === "datos" && (
              <>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>Consumo de datos móviles</Text>
                <Text style={[styles.textoDescripcion, { color: colores.secundario }]}>
                  Activa el ahorro de datos para reducir la descarga de elementos visuales y mapas en segundo plano si estás conectado a redes móviles.
                </Text>
                <Pressable
                  style={[styles.botonAccion, { backgroundColor: colores.primario }]}
                  onPress={() => seleccionarOpcion("ahorroDatos", !ahorroDatos)}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    {ahorroDatos ? "Desactivar ahorro de datos" : "Activar modo ahorro"}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={[styles.botonCerrar, { borderColor: colores.linea, borderWidth: 1 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: colores.texto, fontWeight: "600" }}>Cerrar</Text>
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
    paddingBottom: 30,
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
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 12,
  },

  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  opcionFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  opcionTexto: {
    fontSize: 15,
    fontWeight: "600",
  },

  textoDescripcion: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 4,
  },

  botonAccion: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  botonCerrar: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});
