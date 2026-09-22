import { 
    Pressable,
    Text,
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { DatoPersonal } from "@/components/conductor/DatoPersonal";
import { TarjetaPerfilConductor } from "@/components/conductor/TarjetaPerfilConductor";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { CONDUCTOR_EJEMPLO } from "@/constants/conductor";
import { paletaColores } from "@/paletaColores";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function InformacionPersonalConductor() {
    const [modoEdicion, setModoEdicion] = useState(false);
    const editarDato = (campo: string) => {
        Alert.alert(
            "Editar información",
            `Más adelante aquí podrás modificar ${campo}.`
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <CabeceraConductor
                    titulo="Información personal"
                    subtitulo="Mantén tus datos actualizados para una mejor experiencia en Altokke"
                    mostrarAtras
                    compacta
                />

                <View style={styles.perfilContainer}>
                    <TarjetaPerfilConductor
                        nombre={CONDUCTOR_EJEMPLO.nombre}
                        calificacion={CONDUCTOR_EJEMPLO.calificacion}
                        viajes={CONDUCTOR_EJEMPLO.viajes}
                        estado={CONDUCTOR_EJEMPLO.estado}
                        foto={CONDUCTOR_EJEMPLO.foto}
                        compacta
                    />
                </View>

                <View style={styles.datosCard}>
                    <DatoPersonal
                        icono="person"
                        titulo="Nombre completo"
                        valor={CONDUCTOR_EJEMPLO.nombre}
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu nombre completo")}
                    />
                    <DatoPersonal
                        icono="card"
                        titulo="DNI"
                        valor={CONDUCTOR_EJEMPLO.dni}
                        editable={false}
                    />
                    <DatoPersonal
                        icono="call"
                        titulo="Teléfono"
                        valor={CONDUCTOR_EJEMPLO.telefono}
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu teléfono")}
                    />
                    <DatoPersonal
                        icono="mail"
                        titulo="Correo electrónico"
                        valor={CONDUCTOR_EJEMPLO.correo}
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu correo electrónico")}
                    />
                    <DatoPersonal
                        icono="calendar"
                        titulo="Fecha de nacimiento"
                        valor={CONDUCTOR_EJEMPLO.fechaNacimiento}
                        editable={false}
                    />
                    <DatoPersonal
                        icono="location"
                        titulo="Ciudad"
                        valor={CONDUCTOR_EJEMPLO.ciudad}
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu ciudad")}
                    />
                    <DatoPersonal
                        icono="people"
                        titulo="Contacto de emergencia"
                        valor={`${CONDUCTOR_EJEMPLO.contactoEmergencia.nombre} (${CONDUCTOR_EJEMPLO.contactoEmergencia.parentesco})`}
                        valorSecundario={
                            CONDUCTOR_EJEMPLO.contactoEmergencia.telefono
                        }
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu contacto de emergencia")}
                        ultimo
                    />
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.botonActualizar,
                        pressed && styles.botonActualizarPresionado,
                    ]}
                    onPress={() => setModoEdicion(!modoEdicion)}
                >
                    <Ionicons
                        name={
                            modoEdicion ? "checkmark-outline" : "pencil-outline"
                        }
                        size={17}
                        color={paletaColores.textoOscuro}
                    />
                    <Text style={styles.botonTexto}>
                        {modoEdicion ? "Finalizar edición" : "Actualizar datos"}
                    </Text>
                </Pressable>

                <View style={styles.avisoContainer}>
                    <AvisoInformativo
                        icono="shield-checkmark-outline"
                        titulo="Información segura"
                        texto="Tus datos están protegidos y solo se utilizan para mejorar tu experiencia en Altokke."
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: paletaColores.fondoClaro,
    },

    scrollContent: {
        paddingBottom: 30,
    },

    perfilContainer: {
        marginHorizontal: 18,
        marginTop: 14,
    },

    datosCard: {
        marginHorizontal: 18,
        marginTop: 14,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: paletaColores.superficieClara,
        overflow: "hidden",
    },

    avisoContainer: {
        marginHorizontal: 18,
    },

    botonActualizar: {
        height: 48,
        marginHorizontal: 18,
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 13,
        backgroundColor: paletaColores.boton,
    },

    botonActualizarPresionado: {
        backgroundColor: paletaColores.botonPresionado,
    },

    botonTexto: {
        color: paletaColores.textoOscuro,
        fontSize: 13,
        fontWeight: "700",
    },
});