import { paletaColores } from "@/paletaColores";
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
}

export function IndicadorPasos({ 
  pasoActual, 
  totalPasos, 
  estilo,
  variante = "oscuro",
}: PropsIndicadorPasos) {
  const esClaro = variante === "claro";
  const pasoSeguro = Math.max(
    1,
    Math.min(pasoActual, totalPasos)
  );

  return (
    <View style={[estilos.contenedor, estilo]}>
      <View style={estilos.encabezado}>
        <Text
          style={[
            estilos.contador,
            esClaro && estilos.contadorClaro,
          ]}
        >
          PASO {pasoSeguro} DE {totalPasos}
        </Text>
      </View>

      <View
        style={estilos.barras}
        accessibilityRole="progressbar"
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
                esClaro && estilos.barraClara,
                indice < pasoSeguro &&
                  estilos.barraCompletada,
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
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  contador: {
    fontSize: 12,
    fontWeight: "600",
    color: paletaColores.textoSecundario,
    letterSpacing: 0.5,
  },
  contadorClaro: {
    color: paletaColores.textoSecundarioClaro,
  },
  nombre: {
    fontSize: 12,
    fontWeight: "700",
    color: paletaColores.primary,
  },
  nombreClaro: {
    color: paletaColores.primaryHover,
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
    backgroundColor: paletaColores.borde,
  },
  barraClara: {
    backgroundColor: "#DCE5DF",
  },
  barraCompletada: {
    backgroundColor: paletaColores.primary,
  },
});
