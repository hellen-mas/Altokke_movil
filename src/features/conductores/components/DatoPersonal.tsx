import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTemaConductor, type ColoresConductor } from "@/features/conductores/theme/temaConductor";

interface DatoPersonalProps {
    icono: keyof typeof Ionicons.glyphMap;
    titulo: string;
    valor: string;
    valorSecundario?: string;
    editable?: boolean;
    onEditar?: () => void;
    ultimo?: boolean;
}

export function DatoPersonal({
    icono,
    titulo,
    valor,
    valorSecundario,
    editable = false,
    onEditar,
    ultimo = false,
} : DatoPersonalProps) {
  const { c, estilos: styles } = useTemaConductor(crearEstilos);
    return (
        <View
            style={[
                styles.container,
                ultimo && styles.ultimo,
            ]}
        >
            <View style={styles.iconoContainer}>
                <Ionicons
                    name={icono}
                    size={18}
                    color={c.primario}
                />
            </View>

            <View style={styles.informacion}>
                <Text style={styles.titulo}>{titulo}</Text>
                <Text style={styles.valor}>{valor}</Text>
                {valorSecundario && (
                    <Text style={styles.valorSecundario}>{valorSecundario}</Text>
                )}
            </View>

            {editable && onEditar && (
                <Pressable
                    style={styles.editar}
                    onPress={onEditar}
                    hitSlop={10}
                >
                    <Ionicons
                        name="pencil-outline"
                        size={17}
                        color={c.textoSec}
                    />
                </Pressable>
            )}
        </View>
    );
}

const crearEstilos = (c: ColoresConductor) => StyleSheet.create({
    container: {
        minHeight: 65,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: c.textoSec,
    },

    ultimo: {
        borderBottomWidth: 0,
    },

    iconoContainer: {
        width: 35,
        height: 35,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.primarioSuave,
    },

    informacion: {
        flex: 1,
    },

    titulo: {
        color: c.texto,
        fontSize: 14,
        fontWeight: "700",
    },

    valor: {
        marginTop: 2,
        color: c.textoSec,
        fontSize: 12,
        lineHeight: 14,
    },

    valorSecundario: {
        color: c.textoSec,
        fontSize: 10,
        lineHeight: 13,
    },

    editar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.primarioSuave,
    },
});