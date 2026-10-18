import { AvisoInformativo } from "@/components/conductor/AvisoInformativo";
import { ProgresoRegistro } from "@/components/conductor/ProgresoRegistro";
import BotonPrincipal from "@/components/ui/BotonPrincipal";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { useRegistroConductor } from "@/context/RegistroConductorContext";
import { paletaColores } from "@/paletaColores";
import { conductorService } from "@/services/conductorService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function VehiculoConductor() {
  const [enviando, setEnviando] = useState(false);
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
    nombre,
    apellidos,
    dni,
    correo,
    contrasena,
    telefono,
    foto,
    dniFrente,
    dniReverso,
    selfie,
    licenciaConducir,
    soat,
    antecedentesPenales,
  } = useRegistroConductor();

  const validarFormulario = () => {
    if (!placa.trim() || !marca.trim() || !modelo.trim() || !anio.trim() || !color.trim() || !capacidad.trim()) {
      Alert.alert("Campos incompletos", "Completa todos los datos del vehículo para continuar.");
      return false;
    }

    const anioNumero = Number(anio);
    const anioActual = new Date().getFullYear();
    if (anio.length !== 4 || Number.isNaN(anioNumero) || anioNumero < 1980 || anioNumero > anioActual) {
      Alert.alert("Año inválido", `Ingresa un año válido entre 1980 y ${anioActual}.`);
      return false;
    }

    const capacidadNumero = Number(capacidad);
    if (Number.isNaN(capacidadNumero) || capacidadNumero < 1 || capacidadNumero > 4) {
      Alert.alert("Capacidad inválida", "Ingresa una capacidad válida de pasajeros (1 a 4).");
      return false;
    }

    if (!confirmacionVeracidad) {
      Alert.alert("Confirmación requerida", "Debes confirmar que la información proporcionada es verdadera.");
      return false;
    }

    return true;
  };

  const enviarSolicitud = async () => {
    if (enviando || !validarFormulario()) return;

    setEnviando(true);
    try {
      await conductorService.completarRegistroConductor({
        correo,
        contrasena,
        nombre,
        apellidos,
        telefono,
        dni,
        foto,
        dniFrente,
        dniReverso,
        selfie,
        licenciaConducir,
        soat,
        antecedentesPenales,
        vehiculo: {
          placa,
          marca,
          modelo,
          anio: Number(anio),
          color,
          capacidad: Number(capacidad),
        },
      });

      Alert.alert(
        "Solicitud enviada",
        "Tus documentos y vehículo fueron registrados. Tu cuenta está pendiente de aprobación.",
        [{ text: "Aceptar", onPress: () => router.replace("/registro-conductor/solicitud-enviada") }]
      );
    } catch (error: any) {
      if (error?.message === "CONFIRMAR_CORREO") {
        Alert.alert("Confirma tu correo", "Tu cuenta fue creada, pero debes confirmar tu correo antes de continuar.");
      } else {
        Alert.alert("Error de registro", error?.message || "No se pudo completar el registro.");
      }
    } finally {
      setEnviando(false);
    }
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
        <EncabezadoPagina
          titulo={"Vehículo y\n"}
          tituloDestacado="solicitud"
          descripcion="Completa los datos de tu mototaxi y envía tu solicitud."
          variante="claro"
        />

        <ProgresoRegistro pasoActual={5} />

        <View style={styles.formulario}>
          <CampoTexto
            placeholder="Placa"
            nombreIcono="card-outline"
            value={placa}
            onChangeText={(texto) => setPlaca(texto.toUpperCase())}
            autoCapitalize="characters"
            maxLength={10}
            variante="claro"
          />
          <CampoTexto
            placeholder="Marca"
            nombreIcono="car-outline"
            value={marca}
            onChangeText={setMarca}
            autoCapitalize="words"
            variante="claro"
          />
          <CampoTexto
            placeholder="Modelo"
            nombreIcono="settings-outline"
            value={modelo}
            onChangeText={setModelo}
            autoCapitalize="words"
            variante="claro"
          />
          <CampoTexto
            placeholder="Año"
            nombreIcono="calendar-outline"
            value={anio}
            onChangeText={setAnio}
            keyboardType="numeric"
            maxLength={4}
            variante="claro"
          />
          <CampoTexto
            placeholder="Color"
            nombreIcono="color-palette-outline"
            value={color}
            onChangeText={setColor}
            autoCapitalize="words"
            variante="claro"
          />
          <CampoTexto
            placeholder="Capacidad de pasajeros"
            nombreIcono="people-outline"
            value={capacidad}
            onChangeText={setCapacidad}
            keyboardType="numeric"
            maxLength={1}
            variante="claro"
          />
        </View>

        <Pressable
          style={styles.confirmacion}
          onPress={() => setConfirmacionVeracidad((v) => !v)}
        >
          <View style={[styles.checkbox, confirmacionVeracidad && styles.checkboxActivo]}>
            {confirmacionVeracidad && <Ionicons name="checkmark" size={17} color="#FFFFFF" />}
          </View>
          <Text style={styles.confirmacionTexto}>
            Confirmo que la información proporcionada es verdadera.
          </Text>
        </Pressable>

        <AvisoInformativo
          icono="shield-checkmark-outline"
          texto="Tu cuenta será revisada antes de ser activada."
        />

        <BotonPrincipal
          titulo={enviando ? "Guardando archivos..." : "Enviar solicitud"}
          onPress={enviarSolicitud}
          disabled={enviando}
        />

        <Pressable style={styles.atras} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={paletaColores.textoSecundarioClaro} />
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
    paddingTop: 16,
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
