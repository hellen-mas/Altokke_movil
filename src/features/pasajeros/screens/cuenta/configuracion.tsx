import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EncabezadoPantalla } from "@/features/pasajeros/components/EncabezadoPantalla";
import { ItemMenu } from "@/features/pasajeros/components/ItemMenu";
import { useAuth } from "@/features/autenticacion/context/AuthContext";
import { usePerfilPasajero } from "@/features/pasajeros/hooks/use-perfil-pasajero";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { authService } from "@/features/autenticacion/services/authService";
import { router } from "expo-router";

interface OpcionConfig {
  titulo: string;
  campo: "idioma" | "tema" | "unidades" | "mapaEstilo";
  opciones: string[];
}

const OPCIONES_CONFIG: Record<string, OpcionConfig> = {
  idioma: { titulo: "Seleccionar idioma", campo: "idioma", opciones: ["Español (Perú)", "Quechua", "English"] },
  tema: { titulo: "Apariencia de la app", campo: "tema", opciones: ["Automático (Sistema)", "Claro", "Oscuro"] },
  unidades: { titulo: "Unidades de distancia", campo: "unidades", opciones: ["Kilómetros (km)", "Millas (mi)"] },
  mapa: { titulo: "Estilo del mapa", campo: "mapaEstilo", opciones: ["Estándar", "Satélite", "Híbrido"] },
};

export default function Configuracion() {
  const { colores } = useAltokkeTheme();
  const { userId } = useAuth();
  const { perfil, guardarPreferencias } = usePerfilPasajero();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalClave, setModalClave] = useState<keyof typeof OPCIONES_CONFIG | null>(null);

  const configActual = OPCIONES_CONFIG[modalClave || ""];
  const prefs = perfil?.preferencias || {};

  const seleccionarOpcion = async (campo: string, valor: string) => {
    try {
      if (userId) await guardarPreferencias({ [campo]: valor });
      setModalVisible(false);
      Alert.alert("Configuración guardada", "Tu preferencia ha sido actualizada.");
    } catch {
      Alert.alert("Aviso", "No se pudo actualizar la configuración.");
    }
  };

  const abrir = (clave: keyof typeof OPCIONES_CONFIG) => {
    setModalClave(clave);
    setModalVisible(true);
  };

  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);

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
            } catch (error: any) {
              Alert.alert(
                "No se pudo eliminar la cuenta",
                error?.message || "Inténtalo nuevamente."
              );
            } finally {
              setEliminandoCuenta(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colores.fondo }]}>
      <EncabezadoPantalla titulo="Configuración" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        <ItemMenu icono="globe-outline" titulo="Idioma" subtitulo={prefs.idioma || "Español (Perú)"} onPress={() => abrir("idioma")} />
        <ItemMenu icono="moon-outline" titulo="Tema de la aplicación" subtitulo={prefs.tema || "Automático (Sistema)"} onPress={() => abrir("tema")} />
        <ItemMenu icono="speedometer-outline" titulo="Unidades de distancia" subtitulo={prefs.unidades || "Kilómetros (km)"} onPress={() => abrir("unidades")} />
        <ItemMenu icono="map-outline" titulo="Estilo del mapa" subtitulo={prefs.mapaEstilo || "Estándar"} onPress={() => abrir("mapa")} />
        <ItemMenu
          icono="shield-checkmark-outline"
          titulo="Privacidad y Derechos ARCO"
          subtitulo="Protección de datos personales (Ley N° 29733)"
          onPress={() => Alert.alert("Privacidad", "Tus datos están protegidos conforme a ley. Puedes rectificarlos o solicitar su supresión en cualquier momento.")}
        />
        <ItemMenu
          icono="trash-outline"
          titulo="Eliminar cuenta"
          subtitulo={
            eliminandoCuenta
              ? "Procesando solicitud..."
              : "Solicitar la eliminación de tu cuenta"
          }
          onPress={confirmarEliminarCuenta}
        />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalFondo} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalCaja, { backgroundColor: colores.superficie, borderColor: colores.linea }]}>
            {configActual && (
              <>
                <Text style={[styles.modalTitulo, { color: colores.texto }]}>{configActual.titulo}</Text>
                {configActual.opciones.map((op) => {
                  const seleccionado = (prefs[configActual.campo] || configActual.opciones[0]) === op;
                  return (
                    <Pressable
                      key={op}
                      style={[styles.opcionFila, { borderColor: colores.linea }]}
                      onPress={() => seleccionarOpcion(configActual.campo, op)}
                    >
                      <Text style={[styles.opcionTexto, { color: colores.texto }]}>{op}</Text>
                      {seleccionado && <Ionicons name="checkmark-circle" size={20} color={colores.exitoTexto} />}
                    </Pressable>
                  );
                })}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contenido: {
    padding: 16,
    gap: 12,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCaja: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  opcionFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  opcionTexto: {
    fontSize: 15,
    fontWeight: "500",
  },
});
