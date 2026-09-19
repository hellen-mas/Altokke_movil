import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LogoHeader } from "@/components/ui/LogoHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { paletaColores } from "@/paletaColores";
import { useState } from "react";

type EstadoSolicitud =
  | "PENDIENTE"
  | "APROBADA"
  | "RECHAZADA";

export default function SolicitudEnviada() {
    // TEMPORAL (más adelante el estado vendrá del backend)

    const [estadoSolicitud, setEstadoSolicitud] = useState<EstadoSolicitud>("PENDIENTE");
    const contenido = obtenerContenidoEstado(estadoSolicitud);

    const manejarBoton = () => {
        if (estadoSolicitud === "APROBADA") {
            // router.replace("/conductor");
            return;
        } 

        if (estadoSolicitud === "RECHAZADA") {
            router.replace("/registro-conductor/datos-personales");
            return;
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <LogoHeader variant="light" />

            <View style={styles.contenido}>
                <View
                    style={[
                        styles.iconoPrincipal,
                        {
                            backgroundColor: contenido.fondoIcono,
                        },
                    ]}
                >
                    <Ionicons
                        name={contenido.icono}
                        size={46}
                        color={contenido.color}
                    />
                </View>

                {/* Título */}
                <Text style={styles.titulo}>
                    {contenido.titulo}
                </Text>
                <Text style={styles.descripcion}>
                    {contenido.descripcion}
                </Text>

                {/* Estado */}
                <View style={styles.estadoCard}>
                    <Text style={styles.estadoLabel}>
                        Estado de tu solicitud
                    </Text>

                    <View style={styles.estadoFila}>
                        <View
                            style={[
                                styles.estadoPunto,
                                {
                                    backgroundColor: contenido.color,
                                },
                            ]}
                        />

                        <Text
                            style={[
                                styles.estadoTexto,
                                {
                                    color: contenido.color,
                                },
                            ]}
                        >
                            {contenido.estadoTexto}
                        </Text>
                    </View>
                </View>

                {/* Información */}
                <View style={styles.informacionCard}>
                    <View
                        style={[
                            styles.informacionIcono,
                            {
                                backgroundColor: contenido.fondoIcono,
                            },
                        ]}
                    >
                        <Ionicons
                            name={contenido.iconoInformacion}
                            size={21}
                            color={contenido.color}
                        />
                    </View>

                    <Text style={styles.informacionTexto}>
                        {contenido.informacion}
                    </Text>
                </View>

                {/* Proceso */}
                {estadoSolicitud === "PENDIENTE" && (
                    <View style={styles.procesoContainer}>
                        <Text style={styles.procesoTitulo}>
                            ¿Qué sigue ahora?
                        </Text>

                        <ProcesoItem
                            icono="document-text-outline"
                            titulo="Revisión de información"
                            descripcion="Revisaremos tus datos personales y documentos."
                        />

                        <View style={styles.lineaProceso} />

                        <ProcesoItem
                        icono="shield-checkmark-outline"
                        titulo="Validación"
                        descripcion="Comprobaremos que toda la información sea válida."
                        />

                        <View style={styles.lineaProceso} />

                        <ProcesoItem
                        icono="notifications-outline"
                        titulo="Te notificaremos"
                        descripcion="Recibirás un aviso cuando tu cuenta sea aprobada."
                        />
                    </View>
                )}

                {/* Mensaje de rechazo */}
                {estadoSolicitud === "RECHAZADA" && (
                    <View style={styles.observacionCard}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={21}
                            color={paletaColores.error}
                        />

                        <View style={styles.observacionContenido}>
                        <Text style={styles.observacionTitulo}>
                            Observación
                        </Text>

                        <Text style={styles.observacionTexto}> 
                            Algunos datos o documentos necesitan ser corregidos antes de continuar.
                        </Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.acciones}>
                <PrimaryButton
                    title={contenido.textoBoton}
                    onPress={manejarBoton}
                />

                {estadoSolicitud === "PENDIENTE" && (
                    <Text style={styles.textoInferior}>
                        Puedes cerrar la aplicación. Tu solicitud permanecerá registrada.
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

function obtenerContenidoEstado(
    estado: EstadoSolicitud
) {
    switch(estado) {
        case "APROBADA":
            return {
                titulo: "¡Cuenta aprobada!",
                descripcion: "Tu registro como conductor fue aprobado correctamente.",
                estadoTexto: "Cuenta activa",
                informacion: "Ya puedes comenzar a utilizar Altokke como conductor.",
                textoBoton: "Ir al inicio",
                icono: "checkmark-circle" as const,
                iconoInformacion: "car-sport-outline" as const,
                color: paletaColores.verde,
                fondoIcono: "#E5F8EF",
            };

        case "RECHAZADA":
            return {
                titulo: "Necesitamos una corrección",
                descripcion: "Encontramos información que necesita ser revisada antes de activar tu cuenta.",
                estadoTexto: "Requiere correción",
                informacion: "Revisa las observaciones y actualiza la información solicitada.",
                textoBoton: "Corregir información",
                icono: "alert-circle" as const,
                iconoInformacion: "information-circle-outline" as const,
                color: paletaColores.verde,
                fondoIcono: "#FDECEC",
            };
            
        case "PENDIENTE":
            return {
                titulo: "Solicitud enviada",
                descripcion: "Hemos recibido correctamente tu información.",
                estadoTexto: "Pendiente de revisión",
                informacion: "Tu registro está siendo revisado por el equipo de Altokke.",
                textoBoton: "Entendido",
                icono: "checkmark-circle" as const,
                iconoInformacion: "time-outline" as const,
                color: "#D69B22",
                fondoIcono: "#FFF6DB",
            };
    }
}

interface ProcesoItemProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
}

function ProcesoItem({
  icono,
  titulo,
  descripcion,
}: ProcesoItemProps) {
    return (
        <View style={styles.procesoItem}>
            <View style={styles.procesoIcono}>
                <Ionicons
                    name={icono}
                    size={20}
                    color={paletaColores.verde}
                />
            </View>

            <View style={styles.procesoInformacion}>
                <Text style={styles.procesoItemTitulo}>
                    {titulo}
                </Text>

                <Text style={styles.procesoDescripcion}>
                    {descripcion}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: paletaColores.fondoClaro,
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 38,
    },

    contenido: {
        flex: 1,
        alignItems: "center",
        paddingTop: 48,
    },

    iconoPrincipal: {
        width: 92,
        height: 92,
        borderRadius: 46,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },

    titulo: {
        color: paletaColores.textoClaro,
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 10,
    },

    descripcion: {
        maxWidth: 320,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 14,
        lineHeight: 21,
        textAlign: "center",
        marginBottom: 30,
    },

    estadoCard: {
        width: "100%",
        paddingVertical: 17,
        paddingHorizontal: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: paletaColores.superficieClara,
        marginBottom: 12,
    },

    estadoLabel: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 8,
    },

    estadoFila: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
    },

    estadoPunto: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },

    estadoTexto: {
        fontSize: 15,
        fontWeight: "700",
    },

    informacionCard: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: "#F3F6F4",
    },

    informacionIcono: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
    },

    informacionTexto: {
        flex: 1,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        lineHeight: 18,
    },

    procesoContainer: {
        width: "100%",
        marginTop: 28,
        padding: 18,
        borderRadius: 16,
        backgroundColor: paletaColores.superficieClara,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
    },

    procesoTitulo: {
        color: paletaColores.textoClaro,
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 18,
    },

    procesoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    procesoIcono: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#E8F7F0",
    },

    procesoInformacion: {
        flex: 1,
    },

    procesoItemTitulo: {
        color: paletaColores.textoClaro,
        fontSize: 13,
        fontWeight: "700",
    },

    procesoDescripcion: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 11,
        lineHeight: 16,
        marginTop: 2,
    },

    lineaProceso: {
        width: 1,
        height: 15,
        marginLeft: 19,
        marginVertical: 4,
        backgroundColor: paletaColores.bordeClaro,
    },

    observacionCard: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#FDECEC",
    },

    observacionContenido: {
        flex: 1,
    },

    observacionTitulo: {
        color: paletaColores.error,
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 3,
    },

    observacionTexto: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        lineHeight: 17,
    },

    acciones: {
        width: "100%",
        marginTop: 35,
    },

    textoInferior: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 11,
        lineHeight: 16,
        textAlign: "center",
        marginTop: 13,
    },
})