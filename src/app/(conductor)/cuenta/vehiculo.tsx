import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CabeceraConductor } from "@/components/conductor/CabeceraConductor";
import { DatoPersonal } from "@/components/conductor/DatoPersonal";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { CONDUCTOR_EJEMPLO } from "@/constants/conductor";
import { paletaColores } from "@/paletaColores";

export default function VehiculoConductor() {
    const [modoEdicion, setModoEdicion] = useState(false);
    const vehiculo = CONDUCTOR_EJEMPLO.vehiculo;
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
                {/* Cabecera */}
                <CabeceraConductor
                    titulo="Vehículo"
                    subtitulo="Información de tu mototaxi"
                    mostrarAtras
                    compacta
                />

                {/* Tarjeta del vehículo */}
                <View style={styles.vehiculoCard}>
                    <View style={styles.vehiculoIcono}>
                        <Ionicons
                            name="car-outline"
                            size={42}

                            color={paletaColores.verde}
                        />
                    </View>

                    <View style={styles.vehiculoInformacion}>
                        <Text style={styles.vehiculoNombre}>{vehiculo.marca} {vehiculo.modelo}</Text>
                        <Text style={styles.vehiculoPlaca}>Placa {vehiculo.placa}</Text>
                        <View style={styles.verificadoContainer}>
                            <Ionicons
                                name="checkmark-circle"
                                size={14}
                                color={paletaColores.verde}
                            />
                            <Text style={styles.verificadoTexto}>Vehículo verificado</Text>
                        </View>

                        <Text style={styles.vehiculoDescripcion}>Este es el mototaxi registrado actualmente en tu cuenta.</Text>
                    </View>
                </View>

                {/* Detalles */}
                <View style={styles.seccion}>
                    <Text style={styles.tituloSeccion}>Detalles del vehículo</Text>
                    <View style={styles.datosCard}>
                        <DatoPersonal
                            icono="business-outline"
                            titulo="Marca"
                            valor={vehiculo.marca}
                            editable={modoEdicion}
                            onEditar={() => editarDato("la marca")}
                        />
                        <DatoPersonal
                            icono="settings-outline"
                            titulo="Modelo"
                            valor={vehiculo.modelo}
                            editable={modoEdicion}
                            onEditar={() => editarDato("el modelo")}
                        />
                        <DatoPersonal
                            icono="calendar-outline"
                            titulo="Año"
                            valor={String(vehiculo.anio)}
                            editable={modoEdicion}
                            onEditar={() => editarDato("el año")}
                        />
                        <DatoPersonal
                            icono="color-palette-outline"
                            titulo="Color"
                            valor={vehiculo.color}
                            editable={modoEdicion}
                            onEditar={() => editarDato("el color")}
                        />
                        <DatoPersonal
                            icono="card-outline"
                            titulo="Placa"
                            valor={vehiculo.placa}
                            editable={modoEdicion}
                            onEditar={() => editarDato("la placa")}
                        />
                        <DatoPersonal
                            icono="people-outline"
                            titulo="Capacidad"
                            valor={`${vehiculo.capacidad} pasajeros`}
                            editable={modoEdicion}
                            onEditar={() => editarDato("la capacidad")}
                        />
                        <DatoPersonal
                            icono="shield-checkmark-outline"
                            titulo="Estado del vehículo"
                            valor={vehiculo.estado}
                            editable={false}
                            ultimo
                        />
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.botonActualizar,
                        pressed && styles.botonActualizarPresionado,
                    ]}
                    onPress={() => setModoEdicion(!modoEdicion)}
                >
                    <Ionicons
                        name={modoEdicion ? "checkmark-outline" : "pencil-outline"}
                        size={18}
                        color={paletaColores.textoOscuro}
                    />
                    <Text style={styles.botonTexto}>
                        {modoEdicion ? "Finalizar edición" : "Actualizar datos"}
                    </Text>
                </Pressable>

                <View style={styles.avisoContainer}>
                    <AvisoInformativo
                        icono="information-circle-outline"
                        titulo="Importante"
                        texto="Los cambios realizados en los datos de tu vehículo pueden requerir una nueva verificación por parte de Altokke."
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

    vehiculoCard: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 18,
        marginTop: 16,
        padding: 14,
        gap: 13,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: paletaColores.superficieClara,
        elevation: 3,
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },

    vehiculoIcono: {
        width: 92,
        height: 82,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E8F4ED",
    },

    vehiculoInformacion: {
        flex: 1,
    },

    vehiculoNombre: {
        color: paletaColores.textoClaro,
        fontSize: 15,
        fontWeight: "800",
    },

    vehiculoPlaca: {
        marginTop: 3,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 11,
    },

    verificadoContainer: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 7,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: "#E8F4ED",
    },

    verificadoTexto: {
        color: paletaColores.verde,
        fontSize: 9,
        fontWeight: "700",
    },

    vehiculoDescripcion: {
        marginTop: 7,
        color: paletaColores.textoSecundarioClaro,
        fontSize: 9,
        lineHeight: 13,
    },

    seccion: {
        marginHorizontal: 18,
        marginTop: 18,
    },

    tituloSeccion: {
        marginBottom: 9,
        color: paletaColores.textoClaro,
        fontSize: 14,
        fontWeight: "800",
    },

    datosCard: {
        borderRadius: 17,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: paletaColores.superficieClara,
        overflow: "hidden",
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

    avisoContainer: {
        marginHorizontal: 18,
        marginTop: 2,
    },
})