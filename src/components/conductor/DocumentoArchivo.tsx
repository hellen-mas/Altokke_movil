import { Ionicons } from "@expo/vector-icons";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { paletaColores } from "@/paletaColores";
import { ArchivoDocumento } from "@/types/conductor";

interface DocumentoArchivoProps {
    titulo: string;
    icono: keyof typeof Ionicons.glyphMap;
    archivo: ArchivoDocumento | null;
    onPress: () => void;
}

export function DocumentoArchivo({
    titulo,
    icono, 
    archivo,
    onPress,
} : DocumentoArchivoProps) {
    return (
        <View style={styles.card}>
            <View style={styles.iconoContainer}>
                <Ionicons
                    name={icono}
                    size={28}
                    color={paletaColores.textoSecundarioClaro}
                />
            </View>

            <View style={styles.informacion}>
                <Text style={styles.titulo}>
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
                            styles.estado,
                            archivo && styles.estadoCargado,
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
                style={styles.boton}
                onPress={onPress}
            >
                <Ionicons
                    name="share-outline"
                    size={19}
                    color={paletaColores.verde}
                />
            
                <Text style={styles.botonTexto}>
                    {archivo ? "Cambiar" : "Subir archivo"}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
        minHeight: 86,
        flexDirection: "row",
        alignItems: "center",
        padding: 11,
        gap: 11,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: paletaColores.superficieClara,
    },

    iconoContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F0F3F2",
    },

    informacion: {
        flex: 1,
    },

    titulo: {
        color: paletaColores.textoClaro,
        fontSize: 12,
        fontWeight: "700",
    },

    estadoFila: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },

    estado: {
        flex: 1,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 9,
    },

    estadoCargado: {
        color: paletaColores.verde,
    },

    boton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 7,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#BBDCC9",
        backgroundColor: "#E8F4ED",
    },

    botonTexto: {
        color: paletaColores.verde,
        fontSize: 9,
        fontWeight: "600",
    },
})
