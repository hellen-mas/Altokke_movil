
import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { StyleSheet, Text, View } from "react-native";

type VarianteEstado = "exito" | "alerta" | "error" | "neutro";

interface InsigniaEstadoProps {
  texto: string;
  variante?: VarianteEstado;
}

export function InsigniaEstado({
  texto,
  variante = "neutro",
}: InsigniaEstadoProps) {
  const { esOscuro, colores } = useAltokkeTheme();

  const variantes = {
    exito: {
      fondo: colores.exitoFondo,
      texto: colores.exitoTexto,
    },
    alerta: {
      fondo: esOscuro ? "#49391E" : "#FEF3C7",
      texto: esOscuro ? "#F4CD7C" : "#92400E",
    },
    error: {
      fondo: colores.errorFondo,
      texto: colores.error,
    },
    neutro: {
      fondo: colores.campo,
      texto: colores.secundario,
    },
  };

  const apariencia = variantes[variante];

  return (
    <View
      style={[
        styles.insignia,
        { backgroundColor: apariencia.fondo },
      ]}
    >
      <Text
        style={[styles.texto, { color: apariencia.texto }]}
      >
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  insignia: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  texto: {
    fontSize: 12,
    fontWeight: "600",
  },
});
