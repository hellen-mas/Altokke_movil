import { useAltokkeTheme } from "@/shared/theme/useAltokkeTheme";
import { 
  StyleProp, 
  StyleSheet, 
  Text, 
  View, 
  ViewStyle,
} from "react-native";

export interface PropsIndicadorPasos {
  pasoActual: number;
  totalPasos: number;
  estilo?: StyleProp<ViewStyle>;
  variante?: "oscuro" | "claro";
  etiquetas?: string[];
}

export function IndicadorPasos({ 
  pasoActual, 
  totalPasos, 
  estilo,
}: PropsIndicadorPasos) {
  const { colores } = useAltokkeTheme();

  const totalSeguro = Math.max(1, totalPasos);
  const pasoSeguro = Math.max(
    1,
    Math.min(pasoActual, totalSeguro)
  );

  return (
    <View style={[estilos.contenedor, estilo]}>
        <Text
          style={[
            estilos.contador,
            {
              color: colores.secundario
            },
          ]}
        >
          PASO {pasoSeguro} DE {totalPasos}
        </Text>

      <View
        style={estilos.barras}
        accessibilityRole="progressbar"
        accessibilityLabel="Progreso del registro"
        accessibilityValue={{
          min: 0,
          max: totalPasos,
          now: pasoSeguro,
        }}
      >
        {Array.from(
          { length: totalPasos },
          (_, indice) => (
            <View
              key={indice}
              style={[
                estilos.barra,
                {
                  backgroundColor:
                    indice < pasoSeguro
                      ? colores.exitoTexto
                      : colores.progresoInactivo,
                },
              ]}
            />
          )
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: "100%",
    marginTop: 10,
    marginBottom: 12,
  },
  contador: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  barras: {
    flexDirection: "row",
    gap: 5,
    width: "100%",
  },
  barra: {
    flex: 1,
    height: 5,
    borderRadius: 5,
  },
});
