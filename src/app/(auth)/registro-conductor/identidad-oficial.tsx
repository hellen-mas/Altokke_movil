import { useRegistroConductor } from "@/features/conductores/context/RegistroConductorContext";
import { DocumentoFoto } from "@/features/conductores/components/DocumentoFoto";
import { IndicadorPasos } from "@/shared/components/ui";
import { EncabezadoPagina } from "@/shared/components/ui/EncabezadoPagina";
import BotonPrincipal from "@/shared/components/ui/BotonPrincipal";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { paletaColores } from "@/shared/theme/paletaColores";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Image,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TipoFoto = "frente" | "reverso" | "selfie";

export default function IdentidadOficialConductor() {
    const {
        dniFrente,
        setDniFrente,
        dniReverso,
        setDniReverso,
        selfie,
        setSelfie,
    } = useRegistroConductor();

    const [fotoVistaPrevia, setFotoVistaPrevia] = useState<string | null>(null);
    const [capturando, setCapturando] = useState(false);
    const capturaEnCurso = useRef(false);

    const tomarFoto = async(tipo: TipoFoto) => {
        if (capturaEnCurso.current) return;
        capturaEnCurso.current = true;
        setCapturando(true);

        try {
            const permiso = await ImagePicker.requestCameraPermissionsAsync();

            if (!permiso.granted) {
                Alert.alert(
                    "Permiso de cámara",
                    "Permite el acceso a la cámara para fotografiar tus documentos."
                    );
                return;
            }

            const resultado = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.9,
            });

            if (resultado.canceled || !resultado.assets?.length) {
                return;
            }

            const uri = resultado.assets[0]?.uri;

            if (!uri) {
                Alert.alert(
                    "Imagen inválida",
                    "Intenta tomar la fotografía nuevamente."
                );
                return;
            }

            switch (tipo) {
                case "frente":
                setDniFrente(uri);
                break;
                case "reverso":
                setDniReverso(uri);
                break;
                case "selfie":
                setSelfie(uri);
                break;
            }
        } catch {
            Alert.alert(
                "Error de cámara",
                "No se pudo tomar la fotografía. Inténtalo nuevamente."
            );
        } finally {
            capturaEnCurso.current = false;
            setCapturando(false);
        }
    };

    const continuar = () => {
        if (capturando) return;
        
        if (!dniFrente || !dniReverso || !selfie) {
            const faltantes = [
                !dniFrente && "frente del DNI",
                !dniReverso && "reverso del DNI",
                !selfie && "selfie con DNI",
            ].filter(Boolean);

            Alert.alert(
                "Fotografías pendientes",
                `Completa las fotografías: ${faltantes.join(", ")}.`
            );

            return;
        }
        
        router.push("/registro-conductor/documentos");
    };

    const fotosCompletadas = [
        dniFrente,
        dniReverso,
        selfie,
    ].filter(Boolean).length;

    return (
        <SafeAreaView
            style={styles.areaSegura}
            edges={["top", "bottom"]}
        >
            <StatusBar style="dark"/>
            
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.encabezado}>
                        <EncabezadoPagina
                        titulo="Identidad "
                        tituloDestacado="oficial"
                        descripcion="Documentos para validar tu identidad"
                        variante="claro"
                        />
                    </View>

                    <IndicadorPasos
                        pasoActual={3}
                        totalPasos={5}
                        variante="claro"
                    />

                    {/* Documentos */}
                    <View style={styles.documentosContainer}>
                        <View style={styles.filaSeccion}>
                            <Text style={styles.tituloSeccion}>
                                Fotografías requeridas
                            </Text>

                            <Text style={styles.contador}>
                                {fotosCompletadas}/3
                            </Text>
                        </View>

                        <DocumentoFoto
                            titulo="DNI - Frente"
                            descripcion="Documento completo y legible"
                            foto={dniFrente}
                            onPress={() => tomarFoto("frente")}
                            onVerFoto={() => setFotoVistaPrevia(dniFrente)}
                            deshabilitado={capturando}
                        />
                        <DocumentoFoto
                            titulo="DNI - Reverso"
                            descripcion="Sin reflejos ni recortes"
                            foto={dniReverso}
                            onPress={() => tomarFoto("reverso")}
                            onVerFoto={() => setFotoVistaPrevia(dniReverso)}
                            deshabilitado={capturando}
                        />
                        <DocumentoFoto
                            titulo="Selfie con documento"
                            descripcion="Rostro y documentos visibles"
                            foto={selfie}
                            onPress={() => tomarFoto("selfie")}
                            onVerFoto={() => setFotoVistaPrevia(selfie)}
                            deshabilitado={capturando}
                        />
                    </View>

                    <View style={styles.consejo}>
                        <Ionicons
                        name="information-circle-outline"
                        size={17}
                        color={paletaColores.textoSecundarioClaro}
                        />
                        <Text style={styles.consejoTexto}>
                        Usa buena iluminación y evita reflejos.
                        </Text>
                    </View>

                    <View style={styles.navegacion}>
                        <BotonPrincipal
                        titulo="Continuar"
                        mostrarIcono
                        icono="arrow-forward"
                        onPress={continuar}
                        disabled={capturando}
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
            </KeyboardAvoidingView>

            <Modal
                visible={Boolean(fotoVistaPrevia)}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setFotoVistaPrevia(null)}
            >
                <SafeAreaView
                style={styles.modalFondo}
                edges={["top", "bottom"]}
                >
                <Pressable
                    style={styles.modalCerrar}
                    onPress={() => setFotoVistaPrevia(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar vista previa"
                >
                    <Ionicons
                    name="close"
                    size={26}
                    color="#FFFFFF"
                    />
                </Pressable>

                {fotoVistaPrevia && (
                    <Image
                    source={{ uri: fotoVistaPrevia }}
                    style={styles.imagenAmpliada}
                    resizeMode="contain"
                    />
                )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
        
    );
}

const styles = StyleSheet.create ({
  areaSegura: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  container: {
    flex: 1,
    backgroundColor: paletaColores.fondoClaro,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    backgroundColor: paletaColores.fondoClaro,
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
    marginTop: 18,
    paddingHorizontal: 3,
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
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.94)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCerrar: {
    position: "absolute",
    top: 12,
    right: 18,
    zIndex: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  imagenAmpliada: {
    width: "95%",
    height: "78%",
  },
})
