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
import { AuthFooter } from "@/components/ui/AuthFooter";
import CustomInput from "@/components/ui/CustomInput";
import { LogoHeader } from "@/components/ui/LogoHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import DateTimePicker, {DateTimePickerEvent,} from "@react-native-community/datetimepicker";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DatosPersonalesConductor() {
    const [nombre, setNombre] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
    const [mostrarCalendario, setMostarCalendario] = useState(false);
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");
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
            !confirmarContrasena
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

        Alert.alert(
            "Datos correctos",
            "El paso 1 se completó correctamente."
        );
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
                <LogoHeader variant="light" />

                <PageHeader
                    title={"Registro de\n"}
                    highlightedTitle="conductor"
                    description="Completa tus datos para empezar a conducir con Altokke."
                    variant="light"
                />

                <View
                    style={styles.progressSection}
                >
                    <Text style={styles.pasos}>
                        Paso 1 de 5
                    </Text>

                    <View style={styles.progressContainer}>
                        <View
                            style={[
                                styles.pasoCirculo,
                                styles.pasoCirculoActivo,
                            ]}
                        >
                            <Text style={styles.pasoNumeroActivo}>
                                1
                            </Text>
                        </View>

                        <View style={styles.linea}/>

                        <View style={styles.pasoCirculo}>
                            <Text style={styles.pasoNumero}>2</Text>
                        </View>

                        <View style={styles.linea} />

                        <View style={styles.pasoCirculo}>
                            <Text style={styles.pasoNumero}>3</Text>
                        </View>

                        <View style={styles.linea} />

                        <View style={styles.pasoCirculo}>
                            <Text style={styles.pasoNumero}>4</Text>
                        </View>

                        <View style={styles.linea} />

                        <View style={styles.pasoCirculo}>
                            <Text style={styles.pasoNumero}>5</Text>
                        </View>
                    </View>
                </View>

                {/* Formulario */}
                <View style={styles.formulario}>
                    <CustomInput
                        placeholder="Nombre completo"
                        iconName="person-outline"
                        value={nombre}
                        onChangeText={setNombre}
                        autoCapitalize="words"
                        variant="light"
                    />
                    <CustomInput
                        placeholder="Apellidos"
                        iconName="person-outline"
                        value={apellidos}
                        onChangeText={setApellidos}
                        autoCapitalize="words"
                        variant="light"
                    />
                    <CustomInput
                        placeholder="DNI"
                        iconName="card-outline"
                        value={dni}
                        onChangeText={setDni}
                        keyboardType="numeric"
                        maxLength={8}
                        variant="light"
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
                            maximumDate={new Date()}
                            onChange={(
                                event: DateTimePickerEvent,
                                selectDate?: Date
                            ) => {
                                if (Platform.OS === "android") {
                                    setMostarCalendario(false);
                                }

                                if (event.type === "set" && selectDate) {
                                    setFechaNacimiento(selectDate);
                                }
                            }}
                        />
                    )}
                    <CustomInput
                        placeholder="Correo electrónico"
                        iconName="mail-outline"
                        value={correo}
                        onChangeText={setCorreo}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        variant="light"
                    />
                    <CustomInput
                        placeholder="Contraseña"
                        iconName="lock-closed-outline"
                        value={contrasena}
                        onChangeText={setContrasena}
                        isPassword
                        variant="light"
                    />
                    <CustomInput
                        placeholder="Confirmar contraseña"
                        iconName="lock-closed-outline"
                        value={confirmarContrasena}
                        onChangeText={setConfirmarContrasena}
                        isPassword
                        variant="light"
                    />
                </View>

                {/* Requisito de edad */}
                <View style={styles.noticiaEdad}>
                    <View style={styles.checkCirculo}>
                        <Text style={styles.check}>✓</Text>
                    </View>

                    <Text style={styles.textoEdad}>
                        La edad mínima para conducir con Altokke es
                        de 18 años.
                    </Text>
                </View>

                <PrimaryButton
                    title="Continuar"
                    onPress={continuar}
                />

                <AuthFooter
                    questionText="¿Ya tienes cuenta?"
                    linkText="Iniciar sesión"
                    href="/"
                    showBorder={false}
                    variant="light"
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

    noticiaEdad: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        marginTop: 18,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: "#EAF8F1",
    },

    checkCirculo: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        backgroundColor: paletaColores.verde,
    },

    check: {
        color: paletaColores.textoOscuro,
        fontSize: 14,
        fontWeight: "800",
    },

    textoEdad: {
        flex: 1,
        color: paletaColores.textoClaro,
        fontSize: 13,
        lineHeight: 18,
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
