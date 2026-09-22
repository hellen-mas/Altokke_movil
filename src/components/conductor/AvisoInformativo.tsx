import { Ionicons } from "@expo/vector-icons";
import {
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { paletaColores } from "@/paletaColores";

interface AvisoInformativoProps {
    texto: string;
    titulo?: string;
    icono?: keyof typeof Ionicons.glyphMap;
    style?: StyleProp<ViewStyle>;
}

export function AvisoInformativo ({
    texto,
    titulo,
    icono = "shield-checkmark-outline",
    style,
}: AvisoInformativoProps) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconoContainer}>
                <Ionicons
                    name={icono}
                    size={19}
                    color={paletaColores.verde}
                />
            </View>

            <View style={styles.informacion}>
                {titulo && (
                    <Text style={styles.titulo}>{titulo}</Text>
                )}
                <Text style={styles.texto}>{texto}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
        borderRadius: 12,
        backgroundColor: "#EAF5EF",
    },

    iconoContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#DDEEE5",
    },

    informacion: {
        flex: 1,
    },

    titulo: {
        color: paletaColores.textoClaro,
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 2,
    },

    texto: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        lineHeight: 17,
    },
});