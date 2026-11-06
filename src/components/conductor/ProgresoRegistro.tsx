import { Fragment } from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { paletaColores } from "@/paletaColores";

interface ProgresoRegistroProps {
    pasoActual: number;
    totalPasos?: number;
    style?: StyleProp<ViewStyle>;
}

export function ProgresoRegistro({
    pasoActual,
    totalPasos = 5,
    style,
} : ProgresoRegistroProps) {
    const pasos = Array.from(
        { length: totalPasos },
        (_, indice) => indice + 1
    );

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.textoPaso}>
                Paso {pasoActual} de {totalPasos}
            </Text>

            <View style={styles.progreso}>
                {pasos.map((paso) => {
                    const completado = paso < pasoActual;
                    const activo = paso === pasoActual;

                    return (
                        <Fragment key={paso}>
                            <View
                                style={[
                                    styles.circulo,
                                    completado && styles.circuloCompletado,
                                    activo && styles.circuloActivo,
                                ]}
                            >
                                <Text 
                                    style={[
                                        styles.numero,
                                        completado && styles.numeroCompletado,
                                        activo && styles.numeroActivo,
                                    ]}
                                >{paso}</Text>
                            </View>

                            {paso < totalPasos && (
                                <View
                                    style={[
                                        styles.linea,
                                        paso < pasoActual && styles.lineaCompletada,
                                    ]}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginTop: 25,
        marginBottom: 25,
    },

    textoPaso: {
        color: paletaColores.textoClaro,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 13,
    },

    progreso: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    },

    circulo: {
        width: 27,
        height: 27,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: "#EEF2F0",
    },

    circuloCompletado: {
        backgroundColor: paletaColores.verde,
        borderColor: paletaColores.verde,
    },

    circuloActivo: {
        borderWidth: 2,
        borderColor: paletaColores.verde,
        backgroundColor: "#DDEFE5",
    },

    numero: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        fontWeight: "600",
    },

    numeroCompletado: {
        color: "#FFFFFF",
        fontWeight: "700",
    },

    numeroActivo: {
        color: paletaColores.verde,
        fontWeight: "800",
    },

    linea: {
        flex: 1,
        height: 1,
        backgroundColor: paletaColores.bordeClaro,
    },

    lineaCompletada: {
        height: 2,
        backgroundColor: paletaColores.verde,
    },
});