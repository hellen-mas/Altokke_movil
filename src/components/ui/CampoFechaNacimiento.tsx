import { paletaColores } from "@/paletaColores";
import { calcularEdad } from "@/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

export interface CampoFechaNacimientoProps {
  valorIso?: string;
  valorFecha?: Date | null;
  alCambiar?: (iso: string) => void;
  alCambiarFecha?: (fecha: Date) => void;
  error?: string;
  label?: string;
  variante?: "oscuro" | "claro";
}

export function CampoFechaNacimiento({
  valorIso,
  valorFecha,
  alCambiar,
  alCambiarFecha,
  error,
  label = "Fecha de nacimiento (+18 años)",
  variante = "oscuro",
}: CampoFechaNacimientoProps) {
  const [mostrar, setMostrar] = useState(false);

  // Normalizar fecha
  const fechaObj: Date | null = valorFecha || (valorIso ? new Date(`${valorIso}T00:00:00`) : null);
  const edad = fechaObj ? calcularEdad(fechaObj) : 0;
  const esMayor = Boolean(fechaObj && edad >= 18);

  const textoFecha = fechaObj
    ? `${fechaObj.getDate().toString().padStart(2, "0")}/${(fechaObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${fechaObj.getFullYear()} (${edad} años)`
    : null;

  const hoy = new Date();
  const fechaMaximaNacimiento = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  const fechaPicker = fechaObj || fechaMaximaNacimiento;

  const manejarCambio = (event: DateTimePickerEvent, fecha?: Date) => {
    if (Platform.OS === "android") setMostrar(false);
    if (event.type === "dismissed" || !fecha) return;

    if (calcularEdad(fecha) < 18) {
      Alert.alert("Restricción de edad (+18)", "Debes tener al menos 18 años para registrarte en Altokke.");
    }

    if (alCambiarFecha) {
      alCambiarFecha(fecha);
    }
    if (alCambiar) {
      const [iso] = fecha.toISOString().split("T");
      alCambiar(iso);
    }
  };

  const esClaro = variante === "claro";

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          esClaro && styles.containerClaro,
          pressed && { opacity: 0.8 },
          error ? styles.containerError : null,
          esMayor ? (esClaro ? styles.containerValidoClaro : styles.containerValido) : null,
        ]}
        onPress={() => setMostrar(true)}
      >
        <View style={styles.fila}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color={
              esMayor
                ? paletaColores.boton
                : error
                ? "#FF5E5E"
                : esClaro
                ? paletaColores.textoSecundarioClaro
                : paletaColores.textoSecundario
            }
          />
          <View style={styles.textos}>
            <Text style={[styles.label, esClaro && styles.labelClaro]}>{label}</Text>
            <Text
              style={[
                styles.valor,
                esClaro && styles.valorClaro,
                !textoFecha && (esClaro ? styles.placeholderClaro : styles.placeholder),
              ]}
            >
              {textoFecha || "Selecciona tu fecha de nacimiento"}
            </Text>
          </View>
        </View>
        <Ionicons
          name={esMayor ? "checkmark-circle" : "chevron-forward"}
          size={20}
          color={esMayor ? paletaColores.boton : esClaro ? paletaColores.textoSecundarioClaro : paletaColores.textoSecundario}
        />
      </Pressable>

      {Boolean(error) && <Text style={styles.errorTexto}>{error}</Text>}

      {mostrar && (
        <DateTimePicker
          value={fechaPicker}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={fechaMaximaNacimiento}
          onChange={manejarCambio}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: paletaColores.input,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: paletaColores.borde,
  },
  containerClaro: {
    backgroundColor: paletaColores.inputClaro,
    borderColor: paletaColores.bordeClaro,
  },
  containerValido: {
    borderColor: paletaColores.boton,
    backgroundColor: "rgba(46, 206, 121, 0.05)",
  },
  containerValidoClaro: {
    borderColor: paletaColores.verde,
    backgroundColor: "rgba(46, 206, 121, 0.08)",
  },
  containerError: {
    borderColor: "#FF5E5E",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  textos: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: paletaColores.textoSecundario,
    marginBottom: 2,
  },
  labelClaro: {
    color: paletaColores.textoSecundarioClaro,
  },
  valor: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  valorClaro: {
    color: paletaColores.textoClaro,
  },
  placeholder: {
    color: paletaColores.textoSecundario,
    fontWeight: "400",
  },
  placeholderClaro: {
    color: paletaColores.textoSecundarioClaro,
    fontWeight: "400",
  },
  errorTexto: {
    color: "#FF5E5E",
    fontSize: 12,
    marginLeft: 8,
  },
});
