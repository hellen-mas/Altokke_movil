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
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { DocumentoFoto } from "@/components/conductor/DocumentoFoto";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";

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

                <ProgresoRegistro pasoActual={3}/>

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
                <AvisoInformativo
                    texto="Asegúrate de que las fotografías sean claras y legibles."
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
})