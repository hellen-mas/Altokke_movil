import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { paletaColores } from "@/paletaColores";

interface OpcionCuentaProps {
    icono: keyof typeof Ionicons.glyphMap;
    titulo: string;
    descripcion: string;
    onPress: () => void;
    ultimo?: boolean;
}

export function OpcionCuenta ({
    icono,
    titulo,
    descripcion,
    onPress,
    ultimo = false,
}: OpcionCuentaProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                ultimo && styles.ultimo,
                pressed && styles.presionado,
            ]}
            onPress={onPress} 
        >
            {/* Icono */}
            <View style={styles.iconoContainer}>
                <Ionicons
                    name={icono}
                    size={20}
                    color={paletaColores.verde}
                />
            </View>

            {/* Información */}
            <View style={styles.informacion}>
                <Text style={styles.titulo}>{titulo}</Text>
                <Text style={styles.descripcion}>{descripcion}</Text>
            </View>

            {/* Flecha */}
            <Ionicons
                name="chevron-forward"
                size={19}
                color={paletaColores.textoSecundarioClaro}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: 70,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#EDF1EF",
    },

    ultimo: {
        borderBottomWidth: 0,
    },

    presionado: {
        backgroundColor: "#F5F8F6",
    },

    iconoContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E8F4ED",
    },

    informacion: {
        flex: 1,
    },

    titulo: {
        color: paletaColores.textoClaro,
        fontSize: 14,
        fontWeight: "700",
    },

    descripcion: {
        marginTop: 2,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 11,
    },
})