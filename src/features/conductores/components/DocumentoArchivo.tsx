import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { paletaColores } from "@/shared/theme/paletaColores";
import { ArchivoDocumento } from "@/features/conductores/types/conductor";

interface DocumentoArchivoProps {
    titulo: string;
    icono: keyof typeof Ionicons.glyphMap;
    archivo: ArchivoDocumento | null;
    onPress: () => void;
    deshabilitado?: boolean;
}

export function DocumentoArchivo({
    titulo,
    icono, 
    archivo,
    onPress,
    deshabilitado = false,
} : DocumentoArchivoProps) {
  const { colores } = useAltokkeTheme();

    const cargado = Boolean(archivo);

    return (
        <View 
            style={[
                styles.card,
                cargado && styles.cardCompletada,
                { backgroundColor: cargado ? colores.exitoFondo : colores.superficie, borderColor: colores.linea },
            ]}
        >
            <View style={[styles.iconoContainer, { backgroundColor: colores.campo }]}>
                <Ionicons
                    name={icono}
                    size={24}
                    color={colores.exitoTexto}
                />
            </View>

            <View style={styles.informacion}>
                <Text style={[styles.titulo, { color: colores.texto }]}>
                    {titulo}
                </Text>

                <View style={styles.estadoFila}>
                    <Ionicons
                        name={
                            cargado
                                ? "checkmark-circle"
                                : "time-outline"
                        }
                        size={15}
                        color={
                            cargado
                                ? paletaColores.primaryHover
                                : paletaColores.textoSecundarioClaro
                        }
                    />

                    <Text
                        style={[
                            styles.estado,
                            { color: colores.secundario },
                            archivo && styles.estadoCargado,
                            archivo && { color: colores.exitoTexto },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                    >
                        {archivo?.nombre || "Pendiente" }
                    </Text>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.boton,
                        pressed && styles.presionado,
                    ]}
                    onPress={onPress}
                    disabled={deshabilitado}
                    accessibilityRole="button"
                    accessibilityLabel={
                        cargado
                        ? `Cambiar archivo de ${titulo}`
                        : `Adjuntar archivo de ${titulo}`
                    }
                    >
                    <Ionicons
                        name={
                        cargado
                            ? "refresh-outline"
                            : "cloud-upload-outline"
                        }
                        size={16}
                        color={colores.exitoTexto}
                    />

                    <Text style={[styles.botonTexto, { color: colores.exitoTexto }]}>
                        {cargado
                        ? "Cambiar archivo"
                        : "Adjuntar archivo"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    gap: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: paletaColores.bordeClaro,
    backgroundColor: paletaColores.superficieClara,
  },
  cardCompletada: {
    borderColor: "#B4DCC6",
    backgroundColor: "#FAFDFB",
  },
  iconoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF5EF",
  },
  informacion: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
  },
  titulo: {
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "700",
  },
  estadoFila: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  estado: {
    flex: 1,
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
  },
  estadoCargado: {
    color: paletaColores.primaryHover,
  },
  boton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  botonTexto: {
    color: paletaColores.primaryHover,
    fontSize: 13,
    fontWeight: "700",
  },
  presionado: {
    opacity: 0.65,
  },
})
