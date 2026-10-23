import { 
    Pressable,
    Text,
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { CabeceraConductor } from "@/features/conductores/components/CabeceraConductor";
import { DatoPersonal } from "@/features/conductores/components/DatoPersonal";
import { TarjetaPerfilConductor } from "@/features/conductores/components/TarjetaPerfilConductor";
import { AvisoInformativo } from "@/features/conductores/components/AvisoInformativo";
import { usePerfilConductor } from "@/features/conductores/hooks/use-perfil-conductor";
import { paletaColores } from "@/shared/theme/paletaColores";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function InformacionPersonalConductor() {
    const { perfil } = usePerfilConductor();
    const [modoEdicion, setModoEdicion] = useState(false);
    const editarDato = (campo: string) => {
        Alert.alert(
            "Editar información",
            `Para actualizar ${campo}, contacta a soporte o guarda tus cambios en perfil.`
        );
    };

    return (
        <View style={styles.container}>
            <CabeceraConductor
                    titulo="Información personal"
                    subtitulo="Mantén tus datos actualizados para una mejor experiencia en Altokke"
                    mostrarAtras
                    compacta
                />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                
                <View style={styles.perfilContainer}>
                    <TarjetaPerfilConductor
                        nombre={perfil.nombre}
                        calificacion={perfil.calificacion}
                        viajes={perfil.viajes}
                        estado={perfil.estado}
                        foto={perfil.foto}
                        compacta
                    />
                </View>

                <View style={styles.datosCard}>
                    <DatoPersonal
                        icono="person"
                        titulo="Nombre completo"
                        valor={perfil.nombre}
                        editable={false}
                    />
                    <DatoPersonal
                        icono="card"
                        titulo="DNI"
                        valor={perfil.dni || "Registrado"}
                        editable={false}
                    />
                    <DatoPersonal
                        icono="call"
                        titulo="Teléfono"
                        valor={perfil.telefono || "No especificado"}
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu teléfono")}
                    />
                    <DatoPersonal
                        icono="mail"
                        titulo="Correo electrónico"
                        valor={perfil.correo || "No especificado"}
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu correo electrónico")}
                    />
                    <DatoPersonal
                        icono="calendar"
                        titulo="Fecha de nacimiento"
                        valor={perfil.fechaNacimiento}
                        editable={false}
                    />
                    <DatoPersonal
                        icono="location"
                        titulo="Ciudad"
                        valor={perfil.ciudad}
                        editable={modoEdicion}
                        onEditar={() => editarDato("tu ciudad")}
                    />
                    <DatoPersonal
                        icono="people"
                        titulo="Contacto de emergencia"
                        valor={`${perfil.contactoEmergencia.nombre} (${perfil.contactoEmergencia.parentesco})`}
                        valorSecundario={perfil.contactoEmergencia.telefono}
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
        fontSize: 16,
        fontWeight: "700",
    },
});
