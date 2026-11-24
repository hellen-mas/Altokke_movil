import { useEffect, useState } from "react";
import { 
    FlatList,
    KeyboardAvoidingView,
    Modal, 
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { styles } from "./ModalCancelarViaje.styles";

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

function SeparadorMotivos() {
    return <View style={styles.separadorMotivos} />;
}

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
        let efectoActivo = true;
        if (visible) {
            queueMicrotask(() => {
                if (!efectoActivo) return;
                setMotivoSeleccionado(null);
                setDetalleOtro("");
            });
        }
        return () => {
            efectoActivo = false;
        };
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
                <FlatList
                    data={motivos}
                    style={styles.contenidoDesplazable}
                    contentContainerStyle={styles.contenidoInterior}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(motivo) => motivo}
                    ItemSeparatorComponent={SeparadorMotivos}
                    ListHeaderComponent={
                        <>
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
                        </>
                    }
                    renderItem={({ item: motivo }) => {
                        const seleccionado = motivoSeleccionado === motivo;

                        return (
                            <Pressable
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
                    }}
                    ListFooterComponent={
                        requiereDetalle ? (
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
                        ) : undefined
                    }
                />

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
