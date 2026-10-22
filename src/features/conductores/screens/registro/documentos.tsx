import { useRegistroConductor } from "@/features/conductores/context/RegistroConductorContext";
import { DocumentoArchivo } from "@/features/conductores/components/DocumentoArchivo";
import { IndicadorPasos } from "@/shared/components/ui";
import { EncabezadoPagina } from "@/shared/components/ui/EncabezadoPagina";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import { Ionicons } from "@expo/vector-icons";
import { paletaColores } from "@/shared/theme/paletaColores";
import { ArchivoDocumento } from "@/features/conductores/types/conductor";

import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";

import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TipoDocumento =
  | "licencia"
  | "soat"
  | "antecedentes";

export default function DocumentosConductor() {
    const {
        licenciaConducir,
        setLicenciaConducir,
        soat,
        setSoat,
        antecedentesPenales,
        setAntecedentesPenales
    } = useRegistroConductor();

    const [seleccionando, setSeleccionando] = useState(false);
    const seleccionEnCurso = useRef(false);

    const seleccionarArchivo = async(tipo: TipoDocumento) => {
        if (seleccionEnCurso.current) return;

        seleccionEnCurso.current = true;
        setSeleccionando(true);

        try {
            const resultado = await DocumentPicker.getDocumentAsync({
                type: [
                    "application/pdf",
                    "image/jpg",
                    "image/png",
                ],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (resultado.canceled || !resultado.assets?.length) {
                return;
            }

            const archivo = resultado.assets[0];

            if (!archivo.uri) {
                Alert.alert(
                "Archivo no disponible",
                "No se pudo acceder al documento seleccionado."
                );
                return;
            }

            const documento: ArchivoDocumento = {
                uri: archivo.uri,
                nombre: archivo.name,
                tipo: archivo.mimeType,
            };

            switch (tipo) {
                case "licencia":
                    setLicenciaConducir(documento);
                    break;

                case "soat":
                    setSoat(documento);
                    break;

                case "antecedentes":
                    setAntecedentesPenales(documento);
                    break;
            }
        } catch (error) {
            Alert.alert(
                "No se pudo adjuntar",
                "Ocurrió un problema al seleccionar el archivo. Inténtalo nuevamente."
            );
        } finally {
            seleccionEnCurso.current = false;
            setSeleccionando(false);
        }
    };

    const documentosCompletados = [
        licenciaConducir,
        soat,
        antecedentesPenales,
    ].filter(Boolean).length;

    const continuar = () => {
        if (seleccionEnCurso.current) return;

        if (!licenciaConducir || !soat || !antecedentesPenales) {
            return Alert.alert("Documentos pendientes", "Debes subir todos los documentos requeridos para continuar.");
        }
        router.push("/registro-conductor/vehiculo");
    };

    return (
        <SafeAreaView
            style={styles.areaSegura}
            edges={["top", "bottom"]}
        >
            <StatusBar style="dark"/>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <EncabezadoPagina
                        titulo={"Tus "}
                        tituloDestacado="documentos"
                        descripcion="Adjunta los documentos requeridos"
                        variante="claro"
                    />

                    <IndicadorPasos
                        pasoActual={4}
                        totalPasos={5}
                        variante="claro"
                    />

                    {/* Documentos */}
                    <View style={styles.documentosContainer}>
                        <View style={styles.filaSeccion}>
                            <Text style={styles.tituloSeccion}>
                            Documentos requeridos
                            </Text>

                            <Text style={styles.contador}>
                            {documentosCompletados} de 3
                            </Text>
                        </View>

                        <DocumentoArchivo
                            titulo="Licencia de conducir"
                            icono="id-card-outline"
                            archivo={licenciaConducir}
                            onPress={() => seleccionarArchivo("licencia")}
                            deshabilitado={seleccionando}
                        />

                        <DocumentoArchivo
                            titulo="SOAT"
                            icono="shield-checkmark-outline"
                            archivo={soat}
                            onPress={() => seleccionarArchivo("soat")}
                            deshabilitado={seleccionando}
                        />

                        <DocumentoArchivo
                            titulo="Antecedentes penales"
                            icono="document-text-outline"
                            archivo={antecedentesPenales}
                            onPress={() => seleccionarArchivo("antecedentes")}
                            deshabilitado={seleccionando}
                        />
                    </View>
                    
                    <View style={styles.consejo}>
                        <Ionicons
                            name="information-circle-outline"
                            size={17}
                            color={paletaColores.textoSecundarioClaro}
                        />
                        <Text style={styles.consejoTexto}>
                            Archivos legibles y vigentes. PDF, JPG o PNG.
                        </Text>
                    </View>

                    <View style={styles.navegacion}>
                        <BotonPrincipal
                            titulo="Continuar"
                            mostrarIcono
                            icono="arrow-forward"
                            onPress={continuar}
                            disabled={seleccionando}
                        />

                        <Pressable
                            style={styles.botonVolver}
                            onPress={() => router.back()}
                            accessibilityRole="button"
                            accessibilityLabel="Volver al paso anterior"
                        >
                            <Ionicons
                            name="arrow-back-outline"
                            size={18}
                            color={paletaColores.textoSecundarioClaro}
                            />

                            <Text style={styles.textoVolver}>
                            Volver
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
        </SafeAreaView>
        
    )
}

const styles = StyleSheet.create ({
  areaSegura: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: paletaColores.fondoClaro,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  encabezado: {
    marginTop: 6,
    marginBottom: 8,
  },
  documentosContainer: {
    width: "100%",
    gap: 12,
    marginTop: 16,
  },
  filaSeccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  tituloSeccion: {
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "700",
  },
  contador: {
    color: paletaColores.primaryHover,
    fontSize: 13,
    fontWeight: "700",
  },
  consejo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 3,
    marginTop: 18,
  },
  consejoTexto: {
    flex: 1,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    lineHeight: 18,
  },
  navegacion: {
    marginTop: "auto",
    paddingTop: 28,
    gap: 12,
  },
  botonVolver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
  },
  textoVolver: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 14,
    fontWeight: "600",
  },
})
