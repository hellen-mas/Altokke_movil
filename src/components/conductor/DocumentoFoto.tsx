import { Ionicons } from "@expo/vector-icons";
import {
    Image, 
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { paletaColores } from "@/paletaColores";

interface DocumentoFotoProps {
    titulo: string;
    descripcion: string;
    foto: string | null;
    onPress: () => void;
}

export function DocumentoFoto({
    titulo, 
    descripcion,
    foto,
    onPress,
} : DocumentoFotoProps) {
    return (
        <View style={styles.card}>
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

            <View style={styles.informacion}>
                <Text style={styles.titulo}>
                    {titulo}
                </Text>

                <Text style={styles.descripcion}>
                    {foto 
                        ? "Fotografía registrada"
                        : descripcion}
                </Text>
            </View>

            <Pressable
                style={styles.boton}
                onPress={onPress}
            >
                <Ionicons
                    name="camera-outline"
                    size={17}
                    color={paletaColores.verde}
                />

                <Text style={styles.botonTexto}>
                    {foto ? "Repetir" : "Tomar foto"}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
        minHeight: 82,
        flexDirection: "row",
        alignItems: "center",
        padding: 11,
        gap: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: paletaColores.superficieClara,
    },

    previewContainer: {
        width: 50,
        height: 50,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF3F0",
        overflow: "hidden",
    },

    preview: {
        width: "100%",
        height: "100%",
    },

    informacion: {
        flex: 1,
    },

    titulo: {
        color: paletaColores.textoClaro,
        fontSize: 12,
        fontWeight: "700",
    },

    descripcion: {
        marginTop: 3,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 9,
        lineHeight: 13,
    },

    boton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: "#E8F4ED",
    },

    botonTexto: {
        color: paletaColores.verde,
        fontSize: 9,
        fontWeight: "600",
    },
});