import { useState, useEffect } from "react";
import {
    ActivityIndicator,
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
import { CampoTexto } from "@/components/ui/CampoTexto";
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
import { MedidorPasswordSeguro } from "@/components/ui";
import { buscarDNI } from "@/utils/apiDNI";

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

    // Indica si estamos consultado la API
    const [consultandoDni, setConsultandoDni] = useState(false);
    // Guarda el DNI cuya consulta fue exitosa
    const [dniVerificado, setDniVerificado] = useState("");
    //Mensaje de error de al consulta
    const [errorDni, setErrorDni] = useState("");

    const hoy = new Date();
    const fechaMaximaNacimiento = new Date(
        hoy.getFullYear() - 18,
        hoy.getMonth(),
        hoy.getDate(),
    );

    const cambiarDni = (texto:string) => {
        const nuevoDni = texto.replace(/\D/g, "").slice(0, 8);
        if (nuevoDni === dni) return;

        setDni(nuevoDni);

        setNombre("");
        setApellidos("");
        setDniVerificado("");
        setErrorDni("");
        setConsultandoDni(false);
    };

    useEffect(() => {
        if (!/^\d{8}$/.test(dni)) {
            return;
        }

        // Permite ignorar respeustas de consultas antiguas
        let cancelado = false;

        const temporizador = setTimeout(async () => {
            setConsultandoDni(true);
            setErrorDni("");

            try {
                const datos = await buscarDNI(dni);
                // Ignoramos la respuesta si el DNI cambió
                if (cancelado) return;

                if (!datos.nombres || !datos.apellidos) {
                    throw new Error("La consulta no devolvió nombres y apellidos.");
                }

                setNombre(datos.nombres);
                setApellidos(datos.apellidos);
                setDniVerificado(dni);
            } catch (error:unknown) {
                if (cancelado) return;

                const mensaje = error instanceof Error ? error.message : "No se pudo consultar el DNI.";
                setErrorDni(mensaje);
                setDniVerificado("");
            } finally {
                if (!cancelado) {
                    setConsultandoDni(false);
                }
            }
        }, 500);

        // Cancela el temporizador e invalida respuestas anteriores.
        return () => {
            cancelado = true;
            clearTimeout(temporizador);
        };
    }, [dni, setNombre, setApellidos]);

    const continuar = () => {
        if (consultandoDni) {
            Alert.alert(
                "Consulta en proceso",
                "Espera mientras verificamos los datos de tu DNI."
            );
            return;
        }

        if (dniVerificado !== dni || !/^\d{8}$/.test(dni)) {
            Alert.alert(
                "DNI sin consultar",
                "Debes ingresar un DNI válido y completar la consulta de identidad antes de continuar."
            );
            return;
        }

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

        const requisitosContrasena = [
            contrasena.length >= 12,
            /[A-Z]/.test(contrasena),
            /[a-z]/.test(contrasena),
            /[0-9]/.test(contrasena),
            /[^A-Za-z0-9]/.test(contrasena),
        ];

        if (!requisitosContrasena.every(Boolean)) {
            Alert.alert(
                "Contraseña poco segura",
                "Tu contraseña debe tener al menos 12 caracteres, " +
                "una mayúscula, una minúscula, un número y un símbolo."
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
                    {/* Consulta de DNI */}
                    <View style={styles.contenedorDni}>
                        <CampoTexto
                            placeholder="Número de DNI"
                            nombreIcono="card-outline"
                            value={dni}
                            onChangeText={cambiarDni}
                            keyboardType="number-pad"
                            maxLength={8}
                            variante="claro"
                            error={!!errorDni}
                            textoError={errorDni}
                        />

                        {consultandoDni && (
                            <ActivityIndicator
                                style={styles.indicadorDni}
                                size="small"
                                color={paletaColores.verde}
                            />
                        )}
                    </View>

                    {/* Confirmación de consulta exitosa */}
                    {dniVerificado === dni && dni.length === 8 && (
                        <View style={styles.mensajeExito}>
                            <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={paletaColores.verde}
                            />
                            <Text style={styles.textoExito}>
                                Datos encontrados correctamente
                            </Text>
                        </View>
                    )}

                    <CampoTexto
                        placeholder="Nombre completo"
                        nombreIcono="person-outline"
                        value={nombre}
                        editable={false}
                        variante="claro"
                    />
                    <CampoTexto
                        placeholder="Apellidos"
                        nombreIcono="person-outline"
                        value={apellidos}
                        editable={false}
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
                        placeholder="Correo electrónico"
                        nombreIcono="mail-outline"
                        value={correo}
                        onChangeText={setCorreo}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        variante="claro"
                    />
                    <CampoTexto
                        placeholder="Contraseña"
                        nombreIcono="lock-closed-outline"
                        value={contrasena}
                        onChangeText={setContrasena}
                        esPassword
                        autoCapitalize="none"
                        autoCorrect={false}
                        variante="claro"
                    />

                    <MedidorPasswordSeguro
                        contrasena={contrasena}
                        longitudMinima={12}
                        variante="claro"
                    />

                    <CampoTexto
                        placeholder="Confirmar contraseña"
                        nombreIcono="lock-closed-outline"
                        value={confirmarContrasena}
                        onChangeText={setConfirmarContrasena}
                        esPassword
                        autoCapitalize="none"
                        autoCorrect={false}
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
                    onPress={continuar}
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

    contenedorDni: {
        width: "100%",
        position: "relative",
    },

    indicadorDni: {
        position: "absolute",
        right: 18,
        top: 20,
    },

    mensajeExito: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginTop: -4,
        marginBottom: 4,
    },

    textoExito: {
        color: paletaColores.verde,
        fontSize: 13,
        fontWeight: "600",
    },

})
