import { useAltokkeTheme } from "@/hooks/useAltokkeTheme";
import { calcularEdad } from "@/utils/validaciones";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  label = "Fecha de nacimiento",
}: CampoFechaNacimientoProps) {
  const [mostrar, setMostrar] = useState(false);

  const { esOscuro, colores } = useAltokkeTheme();

  // Normalizar fecha
  const fechaObj: Date | null = valorFecha || (valorIso ? new Date(`${valorIso}T00:00:00`) : null);
  const fechaValida =
    fechaObj !== null &&
    !Number.isNaN(fechaObj.getTime());

  const textoFecha = fechaValida && fechaObj
    ? fechaObj.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const hoy = new Date();
  const fechaMaximaNacimiento = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
  const fechaPicker =
    fechaValida && fechaObj
      ? fechaObj
      : fechaMaximaNacimiento;

  const aplicarFecha = (fecha?: Date) => {
    if (Platform.OS === "android") setMostrar(false);
    if (!fecha) return;

    if (calcularEdad(fecha) < 18) {
      Alert.alert("Restricción de edad (+18)", "Debes tener al menos 18 años para registrarte en Altokke.");
    }

    if (alCambiarFecha) {
      alCambiarFecha(fecha);
    }
    if (alCambiar) {
      const anio = fecha.getFullYear();
      const mes = String(
        fecha.getMonth() + 1
      ).padStart(2, "0");

      const dia = String(
        fecha.getDate()
      ).padStart(2, "0");

      alCambiar(`${anio}-${mes}-${dia}`);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: error
              ? colores.errorFondo
              : colores.campo,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() => setMostrar(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Seleccionar fecha de nacimiento"
      >
          <View style={styles.textos}>
            <Text style={[
              styles.label, 
              {
                color: error 
                  ? colores.error
                  : colores.secundario,
              },
            ]}
            numberOfLines={1}>{label}</Text>
            <Text
              style={[
                styles.valor,
                {
                  color: textoFecha
                    ? colores.textoCampo
                    : colores.secundario,
                },
              ]}
              numberOfLines={1}
            >
              {textoFecha || "Seleccionar fecha"}
            </Text>
          </View>
        <Ionicons
          name= "chevron-forward"
          size={20}
          color={colores.secundario}
        />
      </Pressable>

      {Boolean(error) && (
        <Text
          style={[
            styles.errorTexto,
            { color: colores.error },
          ]}
        >
          {error}
        </Text>
      )}

      {mostrar && (
        <View
          style={{
            backgroundColor: colores.fondo,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <DateTimePicker
            value={fechaPicker}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={fechaMaximaNacimiento}
            onValueChange={(_event, fecha) => {
              if (fecha) aplicarFecha(fecha);
            }}
            onDismiss={() => {
              if (Platform.OS === "android") setMostrar(false);
            }}
            themeVariant={
              esOscuro ? "dark" : "light"
            }
            textColor={Platform.OS === "ios"
                ? colores.texto
                : undefined}
          />

          {Platform.OS === "ios" && (
            <Pressable
              style={styles.botonListo}
              onPress={() => setMostrar(false)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.textoListo,
                  { color: colores.exitoTexto },
                ]}
              >
                Listo
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 6,
  },
  container: {
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 19,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 0,
    borderColor: "transparent",
  },
  textos: {
    flex: 1,
    justifyContent: "center",
    gap: 0,
    paddingRight: 10,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
    marginBottom: 0,
  },
  valor: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  errorTexto: {
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 10,
  },
  botonListo: {
    alignSelf: "flex-end",
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textoListo: {
    fontSize: 15,
    fontWeight: "700",
  },
});
