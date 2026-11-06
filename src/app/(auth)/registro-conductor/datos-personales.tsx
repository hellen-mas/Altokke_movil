import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { paletaColores } from "@/paletaColores";
import { PiePaginaAutenticacion } from "@/components/ui/PiePaginaAutenticacion";
import CampoTexto from "@/components/ui/CampoTexto";
import { EncabezadoLogo } from "@/components/ui/EncabezadoLogo";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import BotonPrincipal from "@/components/ui/BotonPrincipal";
import DateTimePicker, {DateTimePickerEvent,} from "@react-native-community/datetimepicker";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";

export default function DatosPersonalesConductor() {
    const {
        nombre,
        setNombre, 
        apellidos, 
        setApellidos,
        dni,
        setDni,
        fechaNacimiento,
        setFechaNacimiento,
        correo,
        setCorreo,
        contrasena,
        setContrasena,
        confirmarContrasena,
        setConfirmarContrasena,
    } = useRegistroConductor();
    
    const [mostrarCalendario, setMostarCalendario] = useState(false);
    const hoy = new Date();
    const fechaMaximaNacimiento = new Date(
        hoy.getFullYear() - 18,
        hoy.getMonth(),
        hoy.getDate(),
    );

    const continuar = () => {
        if (
            !nombre.trim() ||
            !apellidos.trim() ||
            !dni.trim() ||
            !fechaNacimiento ||
            !correo.trim() ||
            !contrasena ||
            !confirmarContrasena.trim()
        ) {
            Alert.alert(
                "Campos incompletos",
                "Completa todos los campos para continuar."
            );
            return;
        }

        const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
        const cumpleEsteAnio = new Date(
            hoy.getFullYear(),
            fechaNacimiento.getMonth(),
            fechaNacimiento.getDate()
        );
        const edadReal = cumpleEsteAnio > hoy ? edad - 1 : edad;
        if (edadReal < 18) {
            Alert.alert(
                "Edad no permitida",
                "Debes tener al menos 18 años para registrarte como conductor."
            );
            return;
        }

        if (dni.length !== 8) {
            Alert.alert(
                "DNI inválido",
                "El DNI debe contener 8 dígitos."
            );
            return;
        }

        if (contrasena !== confirmarContrasena) {
            Alert.alert(
                "Contraseñas diferentes",
                "Las contraseñas ingresadas no coinciden."
            );
            return;
        }

        router.push("/registro-conductor/verificacion-contacto");
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <EncabezadoLogo variante="claro" />

                <EncabezadoPagina
                    titulo={"Registro de\n"}
                    tituloDestacado="conductor"
                    descripcion="Completa tus datos para empezar a conducir con Altokke."
                    variante="claro"
                />

                <ProgresoRegistro pasoActual={1}/>

                {/* Formulario */}
                <View style={styles.formulario}>
                    <CampoTexto
                        textoReferencia="Nombre completo"
                        nombreIcono="person-outline"
                        valor={nombre}
                        alCambiarTexto={setNombre}
                        autoCapitalize="words"
                        variante="claro"
                    />
                    <CampoTexto
                        textoReferencia="Apellidos"
                        nombreIcono="person-outline"
                        valor={apellidos}
                        alCambiarTexto={setApellidos}
                        autoCapitalize="words"
                        variante="claro"
                    />
                    <CampoTexto
                        textoReferencia="DNI"
                        nombreIcono="card-outline"
                        valor={dni}
                        alCambiarTexto={setDni}
                        keyboardType="numeric"
                        maxLength={8}
                        variante="claro"
                    />
                    <Pressable
                        style={styles.dateInput}
                        onPress={() => setMostarCalendario(true)}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={21}
                            color={paletaColores.textoSecundarioClaro}
                        />
                        <Text
                            style={[
                                styles.dateText,
                                !fechaNacimiento && styles.datePlaceholder,
                            ]}
                        >
                            {fechaNacimiento 
                                ? fechaNacimiento.toLocaleDateString("es-PE")
                                : "Fecha de nacimiento"}
                        </Text>

                        <Ionicons
                            name="calendar-clear-outline"
                            size={21}
                            color={paletaColores.textoSecundarioClaro}
                        />
                    </Pressable>
                    {mostrarCalendario && (
                        <DateTimePicker
                            value={fechaNacimiento ?? fechaMaximaNacimiento}
                            mode="date"
                            maximumDate={fechaMaximaNacimiento}
                            onValueChange={(
                                event: any,
                                selectDate: Date
                            ) => {
                                if (Platform.OS === "android") {
                                    setMostarCalendario(false);
                                }

                                if (selectDate) {
                                    setFechaNacimiento(selectDate);
                                }
                            }}
                            onDismiss={() => {
                                if (Platform.OS === "android") {
                                    setMostarCalendario(false);
                                }
                            }}
                        />
                    )}
                    <CampoTexto
                        textoReferencia="Correo electrónico"
                        nombreIcono="mail-outline"
                        valor={correo}
                        alCambiarTexto={setCorreo}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        variante="claro"
                    />
                    <CampoTexto
                        textoReferencia="Contraseña"
                        nombreIcono="lock-closed-outline"
                        valor={contrasena}
                        alCambiarTexto={setContrasena}
                        esPassword
                        variante="claro"
                    />
                    <CampoTexto
                        textoReferencia="Confirmar contraseña"
                        nombreIcono="lock-closed-outline"
                        valor={confirmarContrasena}
                        alCambiarTexto={setConfirmarContrasena}
                        esPassword
                        variante="claro"
                    />
                </View>

                {/* Requisito de edad */}
                <AvisoInformativo
                    icono="checkmark-circle-outline"
                    texto="La edad minima para conducir con Altokke es de 18 años."
                />

                <BotonPrincipal
                    titulo="Continuar"
                    alPresionar={continuar}
                />

                <PiePaginaAutenticacion
                    textoPregunta="¿Ya tienes cuenta?"
                    textoEnlace="Iniciar sesión"
                    ruta="/"
                    mostrarBorde={false}
                    variante="claro"
                />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: paletaColores.fondoClaro,
    },

    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    progressSection : {
        width: "100%",
        marginTop: 25,
        marginBottom: 25,
    },

    pasos: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 13,
    },

    progressContainer : {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    },

    pasoCirculo: {
        width: 27,
        height: 27,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        backgroundColor: "#EEF2F0",
    },

    pasoCirculoActivo: {
        backgroundColor: paletaColores.verde,
        borderColor: paletaColores.verde,
    },

    pasoNumero: {
        color: paletaColores.textoSecundarioClaro,
        fontSize: 12,
        fontWeight: "600",
    },

    pasoNumeroActivo: {
        color: paletaColores.textoOscuro,
        fontSize: 12,
        fontWeight: "700",
    },

    linea: {
        flex: 1,
        height: 1,
        backgroundColor: paletaColores.bordeClaro,
    },

    formulario: {
        width: "100%",
        gap: 12,
    },

    dateInput: {
        width: "100%",
        height: 58,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: paletaColores.bordeClaro,
        borderRadius: 14,
        backgroundColor: paletaColores.inputClaro,
    },

    dateText: {
        flex: 1,
        fontSize: 16,
        color: paletaColores.textoClaro,
    },

    datePlaceholder: {
        color: paletaColores.textoSecundarioClaro,
    },
})
