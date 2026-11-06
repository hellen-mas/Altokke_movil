import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { paletaColores } from "@/paletaColores";

export interface PropsSelectorFecha {
  textoReferencia: string;
  nombreIcono: keyof typeof Ionicons.glyphMap;
  fecha: Date | null;
  alSeleccionar: (fecha: Date) => void;
}

export function SelectorFecha({
  textoReferencia,
  nombreIcono,
  fecha,
  alSeleccionar,
}: PropsSelectorFecha) {
  const [mostrar, setMostrar] = useState(false);

  const manejarCambioValor = (_evento: any, fechaSeleccionada?: Date) => {
    if (Platform.OS === 'android') {
       setMostrar(false);
    }
    if (fechaSeleccionada) {
      alSeleccionar(fechaSeleccionada);
    }
  };

  const manejarOcultar = () => {
    if (Platform.OS === 'android') {
       setMostrar(false);
    }
  };

  const fechaFormateada = fecha
    ? `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`
    : "";

  return (
    <>
      <Pressable style={estilos.contenedor} onPress={() => setMostrar(true)}>
        <Ionicons name={nombreIcono} size={21} color={paletaColores.textoSecundario} />
        <Text style={[estilos.texto, !fecha && estilos.textoReferencia]}>
          {fechaFormateada || textoReferencia}
        </Text>
      </Pressable>

      {mostrar && (
        <DateTimePicker
          value={fecha || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={manejarCambioValor} onDismiss={manejarOcultar}
          maximumDate={new Date()}
        />
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: paletaColores.borde,
    borderRadius: 14,
    backgroundColor: paletaColores.input,
  },
  texto: {
    flex: 1,
    fontSize: 16,
    color: paletaColores.texto,
  },
  textoReferencia: {
    color: paletaColores.textoSecundario,
  },
});
