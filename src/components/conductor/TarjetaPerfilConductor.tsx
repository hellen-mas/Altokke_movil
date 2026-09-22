import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { paletaColores } from "@/paletaColores";

interface TarjetaPerfilConductorProps {
    nombre: string;
    calificacion: number;
    viajes: number;
    estado?: string;
    foto?: string | null;
    compacta?: boolean;
}

export function TarjetaPerfilConductor({
    nombre,
    calificacion,
    viajes,
    estado = "Conductor activo",
    foto = null,
    compacta = false,
} : TarjetaPerfilConductorProps) {
    return (
        <View
            style={[
                styles.card,
                compacta && styles.cardCompacta,
            ]}
        >
            <View
                style={[
                    styles.avatar,
                    compacta && styles.avatarCompacto,
                ]}
            >
                {foto ? (
                    <Image
                        source={{ uri: foto }}
                        style={styles.foto}
                    />
                ) : (
                    <Ionicons
                        name="person"
                        size={compacta ? 31 : 38}
                        color={paletaColores.textoSecundarioClaro}
                    />
                )}

                <View style={styles.online}/>
            </View>

            <View style={styles.informacion}>
                <Text 
                    style={[
                        styles.nombre,
                        compacta && styles.nombreCompacto,
                    ]}
                >{nombre}</Text>

                <View style={styles.resumen}>
                    <Ionicons
                        name="star"
                        size={13}
                        color="#E6A91D"
                    />

                    <Text style={styles.resumenTexto}>{calificacion}</Text>
                    <View style={styles.punto}/>

                    <Text style={styles.resumenTexto}>{viajes} viajes</Text>
                </View>

                <View style={styles.estado}>
                    <Ionicons
                        name="car-outline"
                        size={12}
                        color={paletaColores.verde}
                    />

                    <Text style={styles.estadoTexto}>{estado}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        minHeight: 102,
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        gap: 13,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: paletaColores.superficieClara,
        elevation: 4,
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.07,
        shadowRadius: 8,
    },

    cardCompacta: {
        minHeight: 88,
        padding: 13,
    },

    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF3F0",
    },

    avatarCompacto: {
        width: 58,
        height: 58,
        borderRadius: 29,
    },

    foto: {
        width: "100%",
        height: "100%",
        borderRadius: 999,
    },

    online: {
        position: "absolute",
        right: 1,
        bottom: 2,
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: paletaColores.verde,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },

    informacion: {
        flex: 1,
    },

    nombre: {
        color: paletaColores.textoClaro,
        fontSize: 16,
        fontWeight: "700",
    },

    nombreCompacto: {
        fontSize: 14,
    },

    resumen: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 4,
    },

    resumenTexto: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 11,
    },

    punto: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor:
        paletaColores.textoSecundarioClaro,
    },

    estado: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 7,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: "#E8F4ED",
    },

    estadoTexto: {
        color: paletaColores.verde,
        fontSize: 10,
        fontWeight: "600",
    },
});