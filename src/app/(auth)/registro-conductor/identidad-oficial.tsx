import { useRegistroConductor } from "@/context/RegistroConductorContext";
import * as ImagePicker from "expo-image-picker";
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
    View,
} from "react-native";

export default function IdentidadOficialConductor() {
    const {
        dniFrente,
        setDniFrente,
        dniReverso,
        setDniReverso,
        selfie,
        setSelfie,
    } = useRegistroConductor();

    const tomarFoto = async(tipo: "frente" | "reverso" | "selfie") => {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();

        if (!permiso.granted) {
            Alert.alert(
                "Permiso necesario",
                "Debes permitir el acceso a la cámara para tomar las fotografías",
            );
            return;
        }

        const resultado = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });

        if (resultado.canceled) {
            return;
        }

        const uri = resultado.assets[0].uri;
        if (tipo === "frente") {
            setDniFrente(uri);
        }
        if (tipo === "reverso") {
            setDniReverso(uri);
        }
        if (tipo === "selfie") {
            setSelfie(uri);
        }
    };

    const continuar = () => {
        if (!dniFrente || !dniReverso || !selfie) {
            Alert.alert(
                "Documentos incompletos",
                "Debe tomar todas las fotografías requeridas para continuar.",
            );
            return;
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
                <LogoHeader variant="light"/>

                <PageHeader
                    title={"Indentidad \n"}
                    highlightedTitle="oficial"
                    description="Sube tus documentos personales para validar tu identidad"
                    variant="light"
                />

                <View style={styles.progressSection}>
                    <Text style={styles.pasos}>Paso 3 de 5</Text>

                    <View style={styles.progressContainer}>
                        <View style={[styles.pasoCirculo, styles.pasoCompletado]}>
                            <Text style={styles.pasoNumeroActivo}>1</Text>
                        </View>
                        <View style={styles.lineaActiva}/>

                        <View style={[styles.pasoCirculo, styles.pasoCompletado]}>
                            <Text style={styles.pasoNumeroActivo}>2</Text>
                        </View>
                        <View style={styles.lineaActiva}/>

                        <View style={[styles.pasoCirculo, styles.pasoCirculoActivo]}>
                            <Text style={styles.pasoNumeroActivo}>3</Text>
                        </View>
                        <View style={styles.linea}/>

                        <View style={styles.pasoCirculo}>
                            <Text style={styles.pasoNumero}>4</Text>
                        </View>
                        <View style={styles.linea} />

                        <View style={styles.pasoCirculo}>
                            <Text style={styles.pasoNumero}>5</Text>
                        </View>
                    </View>
                </View>

                {/* Documentos */}
                <View style={styles.documentosContainer}>
                    <DocumentoFoto
                        titulo="DNI - Frente"
                        descripcion="Sube una foto del frente de tu documento."
                        foto={dniFrente}
                        onPress={() => tomarFoto("frente")}
                    />
                    <DocumentoFoto
                        titulo="DNI - Reverso"
                        descripcion="Sube una foto del reverso de tu documento."
                        foto={dniReverso}
                        onPress={() => tomarFoto("reverso")}
                    />
                    <DocumentoFoto
                        titulo="Selfie con documento"
                        descripcion="Tómate una foto sosteniendo tu documento."
                        foto={selfie}
                        onPress={() => tomarFoto("selfie")}
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
    );
}

interface DocumentoFotoProps {
    titulo: string;
    descripcion: string;
    foto: string | null;
    onPress: () => void;
}

function DocumentoFoto({
    titulo, 
    descripcion,
    foto,
    onPress,
} : DocumentoFotoProps) {
    return (
        <View style={styles.documentoCard}>
            <View style={styles.previewContainer}>
                {foto ? (
                    <Image 
                        source={{ uri: foto }}
                        style={styles.preview}
                    />
                ) : (
                    <Ionicons
                        name="image-outline"
                        size={28}
                        color={paletaColores.textoSecundarioClaro}
                    />
                )}
            </View>

            <View style={styles.documentoInformacion}>
                <Text style={styles.documentoTitulo}>
                    {titulo}
                </Text>

                <Text style={styles.documentoDescripcion}>
                    {foto 
                        ? "Fotografía registada"
                        : descripcion}
                </Text>
            </View>

            <Pressable
                style={styles.botonFoto}
                onPress={onPress}
            >
                <Ionicons
                    name="camera-outline"
                    size={17}
                    color={paletaColores.textoClaro}
                />

                <Text style={styles.botonFotoTexto}>
                    {foto ? "Repetir" : "Tomar foto"}
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
    alignItems: "center",
    justifyContent: "center",
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

  pasoNumero: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    fontWeight: "600",
  },

  pasoNumeroActivo: {
    color: paletaColores.textoClaro,
    fontSize: 12,
    fontWeight: "700",
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
    minHeight: 82,

    flexDirection: "row",
    alignItems: "center",

    padding: 12,

    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    borderRadius: 14,

    backgroundColor: paletaColores.inputClaro,

    gap: 12,
  },

  previewContainer: {
    width: 58,
    height: 58,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EEF2F0",
    overflow: "hidden",
  },

  preview: {
    width: "100%",
    height: "100%",
  },

  documentoInformacion: {
    flex: 1,
  },

  documentoTitulo: {
    color: paletaColores.textoClaro,
    fontSize: 14,
    fontWeight: "700",
  },

  documentoDescripcion: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },

  botonFoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#DDF7EA",
  },

  botonFotoTexto: {
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
    borderRadius: 12,
    backgroundColor: "#EAF8F1",
    gap: 10,
  },

  avisoIcono: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
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