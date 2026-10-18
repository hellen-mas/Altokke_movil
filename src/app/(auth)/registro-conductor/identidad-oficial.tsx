import { useRegistroConductor } from "@/context/RegistroConductorContext";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { paletaColores } from "@/paletaColores";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { router } from "expo-router";
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
import { DocumentoFoto } from "@/components/conductor/DocumentoFoto";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { useState } from 'react';

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

    const tomarFoto = async(tipo: "frente" | "reverso" | "selfie") => {
        if (capturando) return;
        setCapturando(true);

        try {
            const permiso = await ImagePicker.requestCameraPermissionsAsync();

            if (!permiso.granted) {
                Alert.alert(
                    "Permiso necesario",
                    "Debes permitir el acceso a la cámara para tomar las fotografías",
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

            const imagen = resultado.assets[0];

            if (!imagen.uri) {
                Alert.alert(
                    "Imagen inválida",
                    "No se pudo obtener la fotografía. Inténtalo nuevamente."
                );
                return;
            }

            const setters = { frente: setDniFrente, reverso: setDniReverso, selfie: setSelfie };
            setters[tipo](imagen.uri);
        } catch {
            Alert.alert(
                "Error de cámara",
                "No se pudo tomar la fotografía. Inténtalo nuevamente."
            );
        } finally {
            setCapturando(false);
        }
    };

    const continuar = () => {
        const pendientes: [string | null, string, string][] = [
            [dniFrente, "DNI frontal pendiente", "Debes tomar una fotografía del frente de tu DNI."],
            [dniReverso, "DNI posterior pendiente", "Debes tomar una fotografía del reverso de tu DNI."],
            [selfie, "Selfie pendiente", "Debes tomar una fotografía sosteniendo tu documento."],
        ];

        for (const [foto, titulo, msg] of pendientes) {
            if (!foto) return Alert.alert(titulo, msg);
        }

        router.push("/registro-conductor/documentos");
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <EncabezadoPagina
                    titulo={"Identidad \n"}
                    tituloDestacado="oficial"
                    descripcion="Sube tus documentos personales para validar tu identidad"
                    variante="claro"
                />

                <ProgresoRegistro pasoActual={3}/>

                {/* Documentos */}
                <View style={styles.documentosContainer}>
                    <DocumentoFoto
                        titulo="DNI - Frente"
                        descripcion="Fotografía completa, clara y sin reflejos."
                        foto={dniFrente}
                        onPress={() => tomarFoto("frente")}
                        onVerFoto={() => setFotoVistaPrevia(dniFrente)}
                    />
                    <DocumentoFoto
                        titulo="DNI - Reverso"
                        descripcion="Incluye todos los bordes y datos del reverso."
                        foto={dniReverso}
                        onPress={() => tomarFoto("reverso")}
                        onVerFoto={() => setFotoVistaPrevia(dniReverso)}
                    />
                    <DocumentoFoto
                        titulo="Selfie con documento"
                        descripcion="Muestra claramente tu rostro y el documento."
                        foto={selfie}
                        onPress={() => tomarFoto("selfie")}
                        onVerFoto={() => setFotoVistaPrevia(selfie)}
                    />
                </View>

                {/* Aviso */}
                <AvisoInformativo
                    texto="Asegúrate de que las fotografías sean claras y legibles."
                />

                <BotonPrincipal
                    titulo="Continuar"
                    onPress={continuar}
                />

                <Pressable
                    style={styles.atras}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={20}
                        color={paletaColores.textoSecundarioClaro}
                    />

                    <Text style={styles.atrasTexto}>
                        Atrás
                    </Text>
                </Pressable>
            </ScrollView>

            <Modal
                visible={!!fotoVistaPrevia}
                transparent
                animationType="fade"
                onRequestClose={() => setFotoVistaPrevia(null)}
            >
                <View style={styles.modalFondo}>
                    <Pressable
                        style={styles.modalCerrar}
                        onPress={() => setFotoVistaPrevia(null)}
                        accessibilityLabel="Cerrar vista previa"
                    >
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </Pressable>

                    {fotoVistaPrevia && (
                        <Image
                            source={{ uri: fotoVistaPrevia }}
                            style={styles.imagenAmpliada}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        backgroundColor: paletaColores.fondoClaro,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    documentosContainer: {
        width: "100%",
        gap: 12,
    },

    atras: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
    },

    atrasTexto: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 14,
        fontWeight: "600",
    },
  
    modalFondo: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.92)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalCerrar: {
        position: "absolute",
        top: 50,
        right: 24,
        zIndex: 2,
        padding: 10,
    },

    imagenAmpliada: {
        width: "95%",
        height: "75%",
    },

})
