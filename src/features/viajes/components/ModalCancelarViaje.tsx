import { useEffect, useState } from "react";
import { 
    KeyboardAvoidingView,
    Modal, 
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";

export interface ModalCancelarViajeProps {
    visible: boolean;
    rol: 'pasajero' | 'conductor';
    advertenciaLlegada?: boolean;
    onConfirmar: (motivo: string) => Promise<void> | void;
    onCerrar: () => void;
    cargando?: boolean;
}

const MOTIVOS_PASAJERO = [
    "Demora del conductor",
    "Me equivoqué de destino",
    "Cambié de planes",
    "Otro motivo",
];

const MOTIVOS_CONDUCTOR = [
    "Problema mecánico",
    "Tráfico pesado",
    "Pasajero no responde",
    "Emergencia personal",
];

export function ModalCancelarViaje({
    visible,
    rol,
    advertenciaLlegada = false,
    onConfirmar,
    onCerrar,
    cargando = false,
}: ModalCancelarViajeProps) {
    const { colores } = useAltokkeTheme();
    const [motivoSeleccionado, setMotivoSeleccionado] = useState<string | null>(null);
    const [detalleOtro, setDetalleOtro] = useState("");

    const motivos =
        rol === "pasajero"
        ? MOTIVOS_PASAJERO
        : MOTIVOS_CONDUCTOR;

    useEffect(() => {
        if (visible) {
        setMotivoSeleccionado(null);
        setDetalleOtro("");
        }
    }, [visible]);

    const requiereDetalle = motivoSeleccionado === "Otro motivo";
    const motivoFinal = requiereDetalle
        ? detalleOtro.trim()
            ? `Otro motivo: ${detalleOtro.trim()}`
            : ""
        : motivoSeleccionado ?? "";
    
    const puedeConfirmar = Boolean(motivoFinal.trim()) && !cargando;
    const confirmar = () => {
        if (!puedeConfirmar) return;
        void onConfirmar(motivoFinal);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCerrar}
        >  
            <View style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.contenedorTeclado}
            >
                <View
                style={[
                    styles.contenedor,
                    { backgroundColor: colores.superficie },
                ]}
                >
                <ScrollView
                    style={styles.contenidoDesplazable}
                    contentContainerStyle={styles.contenidoInterior}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.cabecera}>
                    <View
                        style={[
                        styles.iconoAlerta,
                        { backgroundColor: colores.errorFondo },
                        ]}
                    >
                        <Ionicons
                        name="alert-circle-outline"
                        size={28}
                        color={colores.error}
                        />
                    </View>

                    <Pressable
                        onPress={onCerrar}
                        disabled={cargando}
                        style={styles.botonCerrar}
                    >
                        <Ionicons
                        name="close"
                        size={23}
                        color={colores.secundario}
                        />
                    </Pressable>
                    </View>

                    <Text style={[styles.titulo, { color: colores.texto }]}>
                    ¿Por qué deseas cancelar?
                    </Text>

                    <Text
                    style={[
                        styles.descripcion,
                        { color: colores.secundario },
                    ]}
                    >
                    {rol === "pasajero"
                        ? "Selecciona el motivo por el que deseas cancelar tu viaje."
                        : "Indica por qué no puedes continuar atendiendo este viaje."}
                    </Text>

                    {rol === "pasajero" && advertenciaLlegada && (
                    <View
                        style={[
                        styles.advertencia,
                        { backgroundColor: colores.errorFondo },
                        ]}
                    >
                        <Ionicons
                        name="information-circle"
                        size={21}
                        color={colores.error}
                        />
                        <Text
                        style={[
                            styles.textoAdvertencia,
                            { color: colores.error },
                        ]}
                        >
                        El conductor ya está esperándote en el punto de
                        encuentro. Considera esta información antes de cancelar.
                        </Text>
                    </View>
                    )}

                    <View style={styles.listaMotivos}>
                    {motivos.map((motivo) => {
                        const seleccionado = motivoSeleccionado === motivo;

                        return (
                        <Pressable
                            key={motivo}
                            onPress={() => setMotivoSeleccionado(motivo)}
                            disabled={cargando}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: seleccionado }}
                            style={[
                            styles.opcion,
                            {
                                backgroundColor: seleccionado
                                ? colores.exitoFondo
                                : colores.campo,
                                borderColor: seleccionado
                                ? colores.exitoTexto
                                : colores.linea,
                            },
                            ]}
                        >
                            <Text
                            style={[
                                styles.textoOpcion,
                                { color: colores.texto },
                            ]}
                            >
                            {motivo}
                            </Text>

                            <Ionicons
                            name={
                                seleccionado
                                ? "radio-button-on"
                                : "radio-button-off"
                            }
                            size={21}
                            color={
                                seleccionado
                                ? colores.exitoTexto
                                : colores.secundario
                            }
                            />
                        </Pressable>
                        );
                    })}
                    </View>

                    {requiereDetalle && (
                    <TextInput
                        value={detalleOtro}
                        onChangeText={setDetalleOtro}
                        editable={!cargando}
                        placeholder="Describe brevemente el motivo..."
                        placeholderTextColor={colores.secundario}
                        multiline
                        maxLength={250}
                        textAlignVertical="top"
                        style={[
                        styles.inputDetalle,
                        {
                            color: colores.texto,
                            backgroundColor: colores.campo,
                            borderColor: colores.linea,
                        },
                        ]}
                    />
                    )}
                </ScrollView>

                <View
                    style={[
                    styles.botones,
                    { borderTopColor: colores.linea },
                    ]}
                >
                    <Pressable
                    onPress={onCerrar}
                    disabled={cargando}
                    style={[
                        styles.botonSecundario,
                        { borderColor: colores.linea },
                    ]}
                    >
                    <Text
                        style={[
                        styles.textoSecundario,
                        { color: colores.texto },
                        ]}
                    >
                        Volver
                    </Text>
                    </Pressable>

                    <Pressable
                    onPress={confirmar}
                    disabled={!puedeConfirmar}
                    style={[
                        styles.botonConfirmar,
                        {
                        backgroundColor: puedeConfirmar
                            ? colores.error
                            : colores.errorFondo,
                        },
                    ]}
                    >
                    <Text
                        style={[
                        styles.textoConfirmar,
                        {
                            color: puedeConfirmar
                            ? "#FFFFFF"
                            : colores.secundario,
                        },
                        ]}
                    >
                        {cargando ? "Cancelando..." : "Confirmar cancelación"}
                    </Text>
                    </Pressable>
                </View>
                </View>
            </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  contenedorTeclado: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    flexShrink: 1,
  },
  contenedor: {
    width: "100%",
    maxHeight: "100%",
    borderRadius: 22,
    padding: 20,
    flexShrink: 1,
    overflow: "hidden",
  },
  contenidoDesplazable: {
    flexShrink: 1,
  },
  contenidoInterior: {
    paddingBottom: 8,
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  iconoAlerta: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  botonCerrar: {
    padding: 8,
  },
  titulo: {
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 7,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 17,
  },
  advertencia: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  textoAdvertencia: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  listaMotivos: {
    gap: 9,
  },
  opcion: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  textoOpcion: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  inputDetalle: {
    minHeight: 85,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    fontSize: 13,
  },
  botones: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
  },
  botonSecundario: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  textoSecundario: {
    fontSize: 13,
    fontWeight: "700",
  },
  botonConfirmar: {
    flex: 1.5,
    minWidth: 0,
    minHeight: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  textoConfirmar: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
});
