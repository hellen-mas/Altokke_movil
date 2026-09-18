import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { Ionicons } from "@expo/vector-icons";
import { paletaColores } from "@/paletaColores";
import { LogoHeader } from "@/components/ui/LogoHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { router } from "expo-router";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

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

        // router.push("/registro-conductor/vehiculo")
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

                <View style={styles.progressSection}>
                    <Text style={styles.pasos}>Paso 4 de 5</Text>

                    <View style={styles.progressContainer}>
                        <View style={[styles.pasoCirculo, styles.pasoCompletado]}>
                            <Text style={styles.pasoNumeroActivo}>1</Text>
                        </View>
                        <View style={styles.lineaActiva}/>
                        
                        <View style={[styles.pasoCirculo, styles.pasoCompletado]}>
                            <Text style={styles.pasoNumeroActivo}>2</Text>
                        </View>
                        <View style={styles.lineaActiva}/>
                        
                        <View style={[styles.pasoCirculo, styles.pasoCompletado]}>
                            <Text style={styles.pasoNumeroActivo}>3</Text>
                        </View>
                        <View style={styles.lineaActiva}/>

                        <View style={[styles.pasoCirculo, styles.pasoCirculoActivo]}>
                            <Text style={styles.pasoNumeroActivo}>4</Text>
                        </View>
                        <View style={styles.linea}/>

                        <View style={styles.pasoCirculo}>
                            <Text style={styles.pasoNumero}>5</Text>
                        </View>
                    </View>
                </View>

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
                <View style={styles.aviso}>
                    <View style={styles.avisoIcono}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={19}
                            color={paletaColores.verde}
                        />
                    </View>

                    <Text style={styles.avisoTexto}>
                        Asegúrate de que las fotos sean claras y legibles.
                    </Text>
                </View>

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

type ArchivoDocumento = {
    uri: string;
    nombre: string;
    tipo?: string;
};

interface DocumentoArchivoProps {
    titulo: string;
    icono: keyof typeof Ionicons.glyphMap;
    archivo: ArchivoDocumento | null;
    onPress: () => void;
}

function DocumentoArchivo({
    titulo,
    icono, 
    archivo,
    onPress,
} : DocumentoArchivoProps) {
    return (
        <View style={styles.documentoCard}>
            <View style={styles.documentoIcono}>
                <Ionicons
                    name={icono}
                    size={28}
                    color={paletaColores.textoSecundarioClaro}
                />
            </View>

            <View style={styles.documentoInfo}>
                <Text style={styles.documentoTitulo}>
                    {titulo}
                </Text>

                <View style={styles.estadoFila}>
                    <Ionicons
                        name={
                            archivo
                                ? "checkmark-circle-outline"
                                : "time-outline"
                        }
                        size={16}
                        color={
                            archivo 
                                ? paletaColores.verde
                                : paletaColores.textoSecundarioClaro
                        }
                    />

                    <Text
                        style={[
                            styles.documentoEstado,
                            archivo && styles.documentoCargado,
                        ]}
                        numberOfLines={1}
                    >
                        {archivo
                            ? archivo.nombre
                            : "Sin cargar" }
                    </Text>
                </View>
            </View>

            <Pressable
                style={styles.botonArchivo}
                onPress={onPress}
            >
                <Ionicons
                    name="share-outline"
                    size={19}
                    color={paletaColores.textoClaro}
                />
            
                <Text style={styles.botonArchivoTexto}>
                    {archivo ? "Cambiar" : "Subir archivo"}
                </Text>
            </Pressable>
        </View>
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

    progressSection: {
        width: "100%",
        marginTop: 25,
        marginBottom: 25,
    },

    pasos: {
        color: paletaColores.textoClaro,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 13,
    },

    progressContainer: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    },

    pasoCirculo: {
        width: 27,
        height: 27,
        borderRadius: 14,

        justifyContent: "center",
        alignItems: "center",

        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,

        backgroundColor: "#EEF2F0",
    },

    pasoCompletado: {
        backgroundColor: paletaColores.verde,
        borderColor: paletaColores.verde,
    },

    pasoCirculoActivo: {
        backgroundColor: "#A5EEC9",
        borderColor: paletaColores.verde,
    },

    pasoNumeroCompletado: {
        color: paletaColores.textoOscuro,
        fontSize: 12,
        fontWeight: "700",
    },

    pasoNumeroActivo: {
        color: paletaColores.textoClaro,
        fontSize: 12,
        fontWeight: "700",
    },

    pasoNumero: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        fontWeight: "600",
    },

    linea: {
        flex: 1,
        height: 1,
        backgroundColor: paletaColores.bordeClaro,
    },

    lineaActiva: {
        flex: 1,
        height: 2,
        backgroundColor: paletaColores.verde,
    },

    documentosContainer: {
        width: "100%",
        gap: 12,
    },

    documentoCard: {
        width: "100%",
        minHeight: 88,
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        borderRadius: 14,
        backgroundColor: paletaColores.inputClaro,
    },

    documentoIcono: {
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 26,
        backgroundColor: "#F0F3F5",
    },

    documentoInfo: {
        flex: 1,
    },

    documentoTitulo: {
        color: paletaColores.textoClaro,
        fontSize: 14,
        fontWeight: "700",
    },

    estadoFila: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 5,
    },

    documentoEstado: {
        flex: 1,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
    },

    documentoCargado: {
        color: paletaColores.verde,
    },

    botonArchivo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 9,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#A7E6CA",
        backgroundColor: "#ECFAF4",
    },

    botonArchivoTexto: {
        color: paletaColores.textoClaro,
        fontSize: 11,
        fontWeight: "600",
    },

    aviso: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
        borderRadius: 12,
        backgroundColor: "#EAF8F1",
    },

    avisoIcono: {
        width: 32,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        backgroundColor: "#DDF7EA",
    },

    avisoTexto: {
        flex: 1,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        lineHeight: 17,
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