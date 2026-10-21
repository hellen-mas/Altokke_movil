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
  ? fechaObj.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
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
        ]}
        onPress={() => setMostrar(true)}
      >
        <View style={styles.fila}>
          <View style={styles.textos}>
            <Text style={[styles.label, esClaro && styles.labelClaro]}>{label}</Text>
            <Text
              style={[
                styles.valor,
                esClaro && styles.valorClaro,
                !textoFecha && (esClaro ? styles.placeholderClaro : styles.placeholder),
              ]}
            >
              {textoFecha || "Seleccionar fecha"}
            </Text>
          </View>
        </View>
        <Ionicons
          name= "chevron-forward"
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
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: paletaColores.input,
    borderRadius: 30,
    paddingHorizontal: 19,
    paddingVertical: 6,
    borderWidth: 0,
    borderColor: "transparent",
  },
  containerClaro: {
    backgroundColor: "#ECEFEB",
    borderColor: "transparent",
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
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "#F6EDED",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  textos: {
    flex: 1,
    justifyContent: "center",
    gap: 0,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
    color: paletaColores.textoSecundario,
    marginBottom: 0,
  },
  labelClaro: {
    color: "#596C60",
  },
  valor: {
    fontSize: 15,
    lineHeight: 20,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  valorClaro: {
    color: "#17251C",
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
