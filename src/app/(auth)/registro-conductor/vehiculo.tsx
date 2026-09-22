import CustomInput from "@/components/ui/CustomInput";
import { LogoHeader } from "@/components/ui/LogoHeader";
import { PageHeader } from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { paletaColores } from "@/paletaColores";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";

export default function VehiculoConductor() {
  const {
    placa,
    setPlaca,
    marca,
    setMarca,
    modelo,
    setModelo,
    anio,
    setAnio,
    color,
    setColor,
    capacidad,
    setCapacidad,
    confirmacionVeracidad,
    setConfirmacionVeracidad,
  } = useRegistroConductor();

  const enviarSolicitud = () => {
    if (
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      !anio.trim() ||
      !color.trim() ||
      !capacidad.trim()
    ) {
      Alert.alert(
        "Campos incompleto",
        "Completa todos los datos del vehículo para continuar.",
      );
      return;
    }

    const anioNumero = Number(anio);
    const anioActual = new Date().getFullYear();

    if (
      anio.length !== 4 ||
      Number.isNaN(anioNumero) ||
      anioNumero < 1980 ||
      anioNumero > anioActual
    ) {
      Alert.alert(
        "Año inválido",
        `Ingresa un año válido entre 1980 y ${anioActual}.`,
      );
      return;
    }

    const capacidadNumero = Number(capacidad);
    if (
      Number.isNaN(capacidadNumero) ||
      capacidadNumero < 1 ||
      capacidadNumero > 4
    ) {
      Alert.alert(
        "Capacidad inválida",
        "Ingresa una capacidad válida de pasajeros.",
      );
      return;
    }

    if (!confirmacionVeracidad) {
      Alert.alert(
        "Confirmación requerida",
        "Debes confirmar que la información proporcionada es verdadera.",
      );
      return;
    }

    router.replace("/registro-conductor/solicitud-enviada");
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
          title={"Vehículo y\n"}
          highlightedTitle="solicitud"
          description="Completa los datos de tu mototaxi y envía tu solicitud."
          variant="light"
        />

        <ProgresoRegistro pasoActual={5}/>

        {/* Formulario */}
        <View style={styles.formulario}>
          <CustomInput
            placeholder="Placa"
            iconName="card-outline"
            value={placa}
            onChangeText={(texto) => setPlaca(texto.toUpperCase())}
            autoCapitalize="characters"
            maxLength={10}
            variant="light"
          />
          <CustomInput
            placeholder="Marca"
            iconName="car-outline"
            value={marca}
            onChangeText={setMarca}
            autoCapitalize="words"
            variant="light"
          />
          <CustomInput
            placeholder="Modelo"
            iconName="settings-outline"
            value={modelo}
            onChangeText={setModelo}
            autoCapitalize="words"
            variant="light"
          />
          <CustomInput
            placeholder="Año"
            iconName="calendar-outline"
            value={anio}
            onChangeText={setAnio}
            keyboardType="numeric"
            maxLength={4}
            variant="light"
          />
          <CustomInput
            placeholder="Color"
            iconName="color-palette-outline"
            value={color}
            onChangeText={setColor}
            autoCapitalize="words"
            variant="light"
          />
          <CustomInput
            placeholder="Capacidad de pasajeros"
            iconName="people-outline"
            value={capacidad}
            onChangeText={setCapacidad}
            keyboardType="numeric"
            maxLength={1}
            variant="light"
          />
        </View>

        {/* Confirmación */}
        <Pressable
          style={styles.confirmacion}
          onPress={() =>
            setConfirmacionVeracidad((valorActual) => !valorActual)
          }
        >
          <View
            style={[
              styles.checkbox,
              confirmacionVeracidad && styles.checkboxActivo,
            ]}
          >
            {confirmacionVeracidad && (
              <Ionicons name="checkmark" size={17} color="#FFFFFF" />
            )}
          </View>

          <Text style={styles.confirmacionTexto}>
            Confirmo que la información proporcionada es verdadera.
          </Text>
        </Pressable>

        {/* Aviso */}
        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tu cuenta será revisada antes de ser activada."
        />

        <PrimaryButton title="Enviar solicitud" onPress={enviarSolicitud} />

        <Pressable style={styles.atras} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={20}
            color={paletaColores.textoSecundarioClaro}
          />

          <Text style={styles.atrasTexto}>Atrás</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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

  formulario: {
    width: "100%",
    gap: 12,
  },

  confirmacion: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: paletaColores.bordeClaro,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: paletaColores.inputClaro,
  },

  checkboxActivo: {
    backgroundColor: paletaColores.verde,
    borderColor: paletaColores.verde,
  },

  confirmacionTexto: {
    flex: 1,
    color: paletaColores.textoClaro,
    fontSize: 13,
    lineHeight: 18,
  },
  
  atras: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },

  atrasTexto: {
    color: paletaColores.textoSecundarioClaro,
    fontSize: 14,
    fontWeight: "600",
  },
});
