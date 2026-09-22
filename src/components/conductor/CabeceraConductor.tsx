import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Image, 
    Pressable, 
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNode } from "react";

interface CabeceraConductorProps {
    titulo: string;
    subtitulo?: string;
    mostrarAtras?: boolean;
    mostrarMarca?: boolean;
    compacta?: boolean;
    children?: ReactNode;
}

export function CabeceraConductor({
    titulo,
    subtitulo,
    mostrarAtras = false, 
    mostrarMarca = false,
    compacta = false,
    children,
}: CabeceraConductorProps) {
    return (
        <>
            <StatusBar style="light"/>

            <LinearGradient
                colors={["#063D2A", "#07543A", "#087048"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1}}
                style={[
                    styles.header,
                    compacta && styles.headerCompacto,
                ]}
            >
                {/* Formas decorativas */}
                <View style={styles.circuloGrande}/>
                <View style={styles.circuloPequeno}/>

                <SafeAreaView edges={["top"]} style={styles.safeArea}>
                    {/* Marca Altokke */}
                    {mostrarMarca && (
                        <View style={styles.marcaFila}>
                            <View style={styles.marca}>
                                <Image
                                    source={require("../../../assets/images/logo-altokke-v2.png")}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />

                                <Text style={styles.logoTexto}>Altokke</Text>
                            </View>

                            <View style={styles.avatarSuperior}>
                                <Ionicons
                                    name="person"
                                    size={18}
                                    color="#FFFFFF"
                                />
                                <View style={styles.online}/>
                            </View>
                        </View>
                    )}

                    {/* Header con botón de atrás */}
                    {mostrarAtras ? (
                        <View style={styles.filaSecundaria}>
                            <Pressable
                                style={styles.botonAtras}
                                onPress={() => router.back()}
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={21}
                                    color="#FFFFFF"
                                />
                            </Pressable>

                            <View style={styles.textoCentrado}>
                                <Text
                                    style={[
                                        styles.titulo,
                                        compacta && styles.tituloCompacto,
                                    ]}
                                >{titulo}</Text>

                                {subtitulo && (
                                    <Text style={styles.subtituloCentrado}>{subtitulo}</Text>
                                )}
                            </View>

                            <View style={styles.espacioDerecho}/>
                        </View>
                    ): (
                        <View style={styles.tituloContainer}>
                            <Text style={styles.titulo}>{titulo}</Text>

                            {subtitulo && (
                                <Text style={styles.subtitulo}>{subtitulo}</Text>
                            )}
                        </View>
                    )}

                    {/* Contenido adicional */}
                    {children && (
                        <View style={styles.contenidoExtra}>{children}</View>
                    )}
                </SafeAreaView>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        width: "100%",
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: "hidden",
    },

    headerCompacto: {
        paddingHorizontal: 18,
        paddingBottom: 14,
    },

    safeArea: {
        width: "100%",
    },

    circuloGrande: {
        position: "absolute",
        width: 190,
        height: 190,
        borderRadius: 95,
        right: -65,
        bottom: -95,
        backgroundColor: "rgba(255,255,255,0.055)",
    },

    circuloPequeno: {
        position: "absolute",
        width: 110,
        height: 110,
        borderRadius: 55,
        right: 40,
        top: 18,
        backgroundColor: "rgba(255,255,255,0.035)",
    },

    marcaFila: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
        marginBottom: 16,
    },

    marca: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    logo: {
        width: 34,
        height: 34,
    },

    logoTexto: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "800",
    },

    avatarSuperior: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.14)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
    },

    online: {
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: "#35E982",
        borderWidth: 2,
        borderColor: "#07543A",
    },

    tituloContainer: {
        marginBottom: 2,
    },

    titulo: {
        color: "#FFFFFF",
        fontSize: 27,
        fontWeight: "800",
    },

    tituloCompacto: {
        fontSize: 19,
    },

    subtitulo: {
        marginTop: 4,
        color: "rgba(255,255,255,0.78)",
        fontSize: 13,
        lineHeight: 18,
    },

    filaSecundaria: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
    },

    botonAtras: {
        width: 39,
        height: 39,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.14)",
    },

    textoCentrado: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 8,
    },

    subtituloCentrado: {
        maxWidth: 270,
        marginTop: 3,
        color: "rgba(255,255,255,0.76)",
        fontSize: 10,
        lineHeight: 14,
        textAlign: "center",
    },

    espacioDerecho: {
        width: 39,
    },

    contenidoExtra: {
        marginTop: 15,
    },
})