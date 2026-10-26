import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { Ionicons } from "@expo/vector-icons";
import {
    Image, 
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { paletaColores } from "@/shared/theme/paletaColores";

interface DocumentoFotoProps {
    titulo: string;
    descripcion: string;
    foto: string | null;
    onPress: () => void;
    onVerFoto?: () => void;
    deshabilitado: boolean;
}

export function DocumentoFoto({
    titulo, 
    descripcion,
    foto,
    onPress,
    onVerFoto,
    deshabilitado = false,
} : DocumentoFotoProps) {
  const { colores } = useAltokkeTheme();
    const tieneFoto = Boolean(foto);

    return (
        <View 
            style={[
                styles.card,
                tieneFoto && styles.cardCompletada,
                { backgroundColor: tieneFoto ? colores.exitoFondo : colores.superficie, borderColor: colores.linea },
            ]}
        >
            <Pressable
                style={[styles.previewContainer, { backgroundColor: colores.campo }]}
                onPress={onVerFoto}
                disabled={!foto || !onVerFoto}
                accessibilityRole="button"
                accessibilityLabel={`Ver fotografía de ${titulo}`}
            >
                {foto ? (
                    <Image
                    source={{ uri: foto }}
                    style={styles.preview}
                    resizeMode="cover"
                    />
                ) : (
                    <Ionicons
                        name={
                            titulo.toLowerCase().includes("selfie")
                                ? "person-outline"
                                : "id-card-outline"
                            }
                        size={26}
                        color={colores.exitoTexto}
                    />
                )}
            </Pressable>

            <View style={styles.informacion}>
                <View style={styles.filaTitulo}>
                    <Text style={[styles.titulo, { color: colores.texto }]}>
                        {titulo}
                    </Text>

                    {tieneFoto && (
                        <Ionicons
                        name="checkmark-circle"
                        size={17}
                        color={colores.primario}
                        />
                    )}
                </View>
                
                <Text style={[styles.descripcion, { color: colores.secundario }]} numberOfLines={2}>
                    {tieneFoto ? "Foto registrada" : descripcion }
                </Text>

                <Pressable
                    style={({ pressed }) => [
                        styles.boton,
                        pressed && styles.presionado,
                    ]}
                    onPress={onPress}
                    disabled={deshabilitado}
                    accessibilityRole="button"
                    accessibilityLabel={
                        tieneFoto
                        ? `Repetir fotografía de ${titulo}`
                        : `Tomar fotografía de ${titulo}`
                    }
                    >
                    <Ionicons
                        name={
                        tieneFoto
                            ? "refresh-outline"
                            : "camera-outline"
                        }
                        size={16}
                        color={colores.exitoTexto}
                    />

                    <Text style={[styles.botonTexto, { color: colores.exitoTexto }]}>
                        {tieneFoto ? "Repetir foto" : "Tomar foto"}
                    </Text>
                    </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
   card: {
    width: "100%",
    minHeight: 90,
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
  previewContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF5EF",
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  informacion: {
    flex: 1,
    gap: 5,
    alignItems: "flex-start",
  },
  filaTitulo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titulo: {
    flexShrink: 1,
    color: paletaColores.textoClaro,
    fontSize: 15,
    fontWeight: "700",
  },
  descripcion: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 12,
    lineHeight: 17,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginTop: 1,
  },
  botonTexto: {
    color: paletaColores.primaryHover,
    fontSize: 13,
    fontWeight: "700",
  },
  presionado: {
    opacity: 0.65,
  },
});