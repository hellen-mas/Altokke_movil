import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { useDocumentosConductor } from "@/features/conductores/hooks/use-documentos-conductor";
import type { DocumentoConductor } from "@/features/conductores/services/documentosConductorService";
import {
  useTemaConductor,
  type ColoresConductor,
} from "@/features/conductores/theme/temaConductor";
import { AvisoInformativo } from "@/shared/components/ui";

export default function DocumentosConductor() {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);

  const {
    documentos, 
    cargando, 
    error, 
    recargar, 
    obtenerUrlDocumento,
  } = useDocumentosConductor();

  const [documentoAbiertoId, setDocumentoAbiertoId] =
    useState<string | null>(null);

  const abrirDocumento = async (documento: DocumentoConductor) => {
    if (documentoAbiertoId) return;

    setDocumentoAbiertoId(documento.id);

    try {
      // Primero solicitamos una URL temporal a Supabase.
      const url = await obtenerUrlDocumento(documento.ruta);

      // Abrimos el archivo utilizando el navegador del dispositivo.
      await WebBrowser.openBrowserAsync(url);
    } catch (err: unknown) {
      console.error("Error al abrir documento:", err);

      Alert.alert(
        "No se pudo abrir el documento",
        err instanceof Error
          ? err.message
          : "Comprueba tu conexión e inténtalo nuevamente."
      );
    } finally {
      setDocumentoAbiertoId(null);
    }
  };

  const fechaDocumento = (fecha: string) => {
    const fechaValida = new Date(fecha);

    if (Number.isNaN(fechaValida.getTime())) {
      return "Fecha no disponible";
    }

    return fechaValida.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } 

  return (
    <View style={styles.container}>
      <CabeceraConductor titulo="Documentos" mostrarAtras compacta />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.encabezadoCard}>
          <View style={styles.iconoPrincipal}>
            <Ionicons
              name="folder-open-outline"
              size={28}
              color={c.primario}
            />
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.tituloPrincipal}>
              Mi documentación
            </Text>

            <Text style={styles.descripcionPrincipal}>
              Consulta los documentos que registraste en tu cuenta.
              Puedes abrirlos para visualizar su contenido.
            </Text>
          </View>
        </View>

        {cargando && documentos.length === 0 && (
          <View style={styles.estadoContainer}>
            <ActivityIndicator size="large" color={c.primario} />
            <Text style={styles.estadoTexto}>
              Cargando tus documentos...
            </Text>
          </View>
        )}

        {!cargando && error && documentos.length === 0 && (
          <View style={styles.estadoContainer}>
            <Ionicons
              name="cloud-offline-outline"
              size={38}
              color={c.error}
            />

            <Text style={styles.estadoTitulo}>
              No pudimos cargar tus documentos
            </Text>

            <Text style={styles.estadoTexto}>
              Intenta nuevamente cuando tengas conexión.
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() => void recargar()}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.botonReintentarTexto}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        )}

        {!cargando && !error && documentos.length === 0 && (
          <View style={styles.estadoContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color={c.error}
            />

            <Text style={styles.estadoTitulo}>
              No se pudo encontrar tu documentación
            </Text>

            <Text style={styles.estadoTexto}>
              Tu cuenta figura como aprobada, pero no encontramos
              los documentos asociados. Intenta actualizar la
              información o comunícate con soporte.
            </Text>

            <Pressable
              style={styles.botonReintentar}
              onPress={() => void recargar()}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.botonReintentarTexto}>
                Volver a intentar
              </Text>
            </Pressable>
          </View>
        )}

        {documentos.length > 0 && (
          <View style={styles.lista}>
            <Text style={styles.seccionTitulo}>
              Documentos registrados
            </Text>

            {documentos.map((documento) => {
              const abriendo =
                documentoAbiertoId === documento.id;

              const esPdf = documento.formato === "pdf";

              return (
                <Pressable
                  key={documento.id}
                  disabled={documentoAbiertoId !== null}
                  style={({ pressed }) => [
                    styles.item,
                    pressed && styles.itemPresionado,
                    documentoAbiertoId !== null &&
                      !abriendo && styles.itemDeshabilitado,
                  ]}
                  onPress={() => void abrirDocumento(documento)}
                >
                  <View style={styles.iconoDocumento}>
                    <Ionicons
                      name={
                        esPdf
                          ? "document-text-outline"
                          : "image-outline"
                      }
                      size={25}
                      color={c.primario}
                    />
                  </View>

                  <View style={styles.informacion}>
                    <Text style={styles.itemTitulo}>
                      {documento.titulo}
                    </Text>

                    <Text style={styles.itemDescripcion}>
                      {esPdf ? "Archivo PDF" : "Archivo de imagen"}
                      {" · "}
                      {fechaDocumento(documento.fechaSubida)}
                    </Text>
                  </View>

                  {abriendo ? (
                    <ActivityIndicator color={c.primario} />
                  ) : (
                    <Ionicons
                      name="eye-outline"
                      size={22}
                      color={c.primario}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tus documentos son privados y solo pueden visualizarse mediante enlaces temporales autorizados."
          variante="claro"
        />
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    scroll: {
      padding: 18,
      gap: 18,
      paddingBottom: 40,
    },
    encabezadoCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.superficie,
      borderRadius: 16,
      padding: 16,
      gap: 14,
      borderWidth: 1,
      borderColor: c.borde,
    },
    iconoPrincipal: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: c.primarioSuave,
      alignItems: "center",
      justifyContent: "center",
    },
    tituloPrincipal: {
      fontSize: 17,
      fontWeight: "800",
      color: c.texto,
    },
    descripcionPrincipal: {
      fontSize: 13,
      lineHeight: 19,
      color: c.textoSec,
    },
    lista: {
      gap: 12,
    },
    seccionTitulo: {
      fontSize: 16,
      fontWeight: "800",
      color: c.texto,
      marginBottom: 2,
    },
    item: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.superficie,
      borderRadius: 14,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: c.borde,
    },
    itemPresionado: {
      opacity: 0.75,
    },
    itemDeshabilitado: {
      opacity: 0.55,
    },
    iconoDocumento: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor: c.primarioSuave,
      alignItems: "center",
      justifyContent: "center",
    },
    informacion: {
      flex: 1,
      gap: 4,
    },
    itemTitulo: {
      fontSize: 14,
      fontWeight: "700",
      color: c.texto,
    },
    itemDescripcion: {
      fontSize: 12,
      color: c.textoSec,
    },
    accionTexto: {
      fontSize: 12,
      fontWeight: "700",
      color: c.primario,
    },
    estadoContainer: {
      backgroundColor: c.superficie,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: c.borde,
    },
    estadoTitulo: {
      fontSize: 16,
      fontWeight: "800",
      color: c.texto,
      textAlign: "center",
    },
    estadoTexto: {
      fontSize: 13,
      lineHeight: 19,
      color: c.textoSec,
      textAlign: "center",
    },
    botonReintentar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primario,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 12,
      gap: 8,
      marginTop: 4,
    },
    botonReintentarTexto: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
});
