import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { Ionicons } from "@expo/vector-icons";
import { paletaColores } from "@/paletaColores";
import { LogoHeader } from "@/components/ui/LogoHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
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
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { DocumentoArchivo } from "@/components/conductor/DocumentoArchivo";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";

export default function DocumentosConductor() {
    const {
        licenciaConducir,
        setLicenciaConducir,
        soat,
        setSoat,
        antecedentesPenales,
        setAntecedentesPenales
    } = useRegistroConductor();

    const seleccionarArchivo = async(tipo: "licencia" | "soat" | "antecedentes") => {
        const resultado = await DocumentPicker.getDocumentAsync({
            type: [
                "application/pdf",
                "image/jpg",
                "image/png",
            ],
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (resultado.canceled) {
            return;
        }

        const archivo = resultado.assets[0];

        const documento = {
            uri: archivo.uri,
            nombre: archivo.name,
            tipo: archivo.mimeType,
        };

        if (tipo === "licencia") {
            setLicenciaConducir(documento);
        }
        if (tipo === "soat") {
            setSoat(documento);
        }
        if (tipo === "antecedentes") {
            setAntecedentesPenales(documento);
        }
    };

    const continuar = () => {
        if (!licenciaConducir || !soat || !antecedentesPenales) {
            Alert.alert(
                "Documentos incompletos",
                "Debes subir todos los documentos requeridos para continuar."
            );

            return;
        }

        router.push("/registro-conductor/vehiculo")
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
                <LogoHeader variant="light"/>

                <PageHeader
                    title={"Documentos del\n"}
                    highlightedTitle="conductor"
                    description="Carga los documentos requeridos para conducir en Altokke"
                    variant="light"
                />

                <ProgresoRegistro pasoActual={4}/>

                {/* Documentos */}
                <View style={styles.documentosContainer}>
                    <DocumentoArchivo
                        titulo="Licencia de conducir"
                        icono="document-text-outline"
                        archivo={licenciaConducir}
                        onPress={() => seleccionarArchivo("licencia")}
                    />

                    <DocumentoArchivo
                        titulo="Soat"
                        icono="shield-checkmark-outline"
                        archivo={soat}
                        onPress={() => seleccionarArchivo("soat")}
                    />

                    <DocumentoArchivo
                        titulo="Certificado de antecedentes penales"
                        icono="document-text-outline"
                        archivo={antecedentesPenales}
                        onPress={() => seleccionarArchivo("antecedentes")}
                    />
                </View>

                {/* Aviso */}
                <AvisoInformativo
                    texto="Asegúrate de que los documentos estén vigentes y sean legibles."
                />

                <PrimaryButton
                    title="Continuar"
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
        </KeyboardAvoidingView>
    )
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
})