import { useColoresConductor } from "@/features/conductores/theme/temaConductor";
import { Ionicons } from "@expo/vector-icons";
import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";

export interface BarraProgresoViajeProps {
    etapaActual: number; //0: aceptado, 1: en camino, 2: te espera, 3: En viaje, 4: llegó
    etapas?: string[];
    colorPrimario?: string;
}

const ETAPAS_POR_DEFECTO = ["Aceptado", "En camino", "Te espera", "En viaje", "Llegó"];

//Barra de pasos que muestra en que estapa del viaje estamos
export function BarraProgresoViaje({
    etapaActual,
    etapas = ETAPAS_POR_DEFECTO,
    colorPrimario,
}: BarraProgresoViajeProps) {
    const { c } = useColoresConductor();
    const color = colorPrimario ?? c.primario;

    //evita indices fuera de rango
    const actual = Math.min(Math.max(etapaActual, 0), etapas.length - 1);

    return (
        <View style={styles.contenedor}>
        {/* Fila de círculos unidos por líneas */}
        <View style={styles.fila}>
            {etapas.map((etapa, indice) => {
            const completada = indice < actual;
            const enCurso = indice === actual;

            return (
                <Fragment key={etapa}>
                {/* Línea que une con el paso anterior */}
                {indice > 0 && (
                    <View
                    style={[
                        styles.linea,
                        { backgroundColor: indice <= actual ? color : c.borde },
                    ]}
                    />
                )}

                <View
                    style={[
                    styles.circulo,
                    completada || enCurso
                        ? { backgroundColor: color, borderColor: color }
                        : { backgroundColor: c.superficie, borderColor: c.textoSec },
                    enCurso && styles.circuloActual,
                    ]}
                >
                    {completada ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                    <Text
                        style={[
                        styles.numero,
                        { color: enCurso ? "#FFFFFF" : c.textoSec },
                        ]}
                    >
                        {indice + 1}
                    </Text>
                    )}
                </View>
                </Fragment>
            );
            })}
        </View>

        {/* Fila de nombres de cada etapa */}
        <View style={styles.filaEtiquetas}>
            {etapas.map((etapa, indice) => (
            <Text
                key={etapa}
                style={[
                styles.etiqueta,
                {
                    color: indice <= actual ? c.texto : c.textoSec,
                    fontWeight: indice === actual ? "800" : "500",
                },
                ]}
                numberOfLines={1}
            >
                {etapa}
            </Text>
            ))}
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: { paddingVertical: 6 },
    fila: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18},
    linea: { flex: 1, height: 3, borderRadius: 2 },
    circulo: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    circuloActual: { transform: [{ scale: 1.15 }] },
    numero: { fontSize: 11, fontWeight: "800" },
    filaEtiquetas: { flexDirection: "row", marginTop: 8 },
    etiqueta: { flex: 1, fontSize: 10, textAlign: "center" },
})
